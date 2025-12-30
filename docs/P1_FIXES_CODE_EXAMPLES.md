# Примеры кода для исправления проблем P1

## P1.1 - Безопасный JSON.parse

### automation.service.ts

```typescript
// ❌ БЫЛО (строки 174, 252):
const meta = JSON.parse(post.meta);

// ✅ ДОЛЖНО БЫТЬ:
private parsePostMeta(metaString: string, postId: string): any {
  try {
    return JSON.parse(metaString);
  } catch (error) {
    this.logger.error(`Failed to parse post meta for post ${postId}`, error);
    return {}; // Возвращаем пустой объект как fallback
  }
}

// Использование:
const meta = this.parsePostMeta(post.meta, postId);
```

### api-tokens.service.ts

```typescript
// ❌ БЫЛО (строка 205):
scopeProjectIds: JSON.parse(token.scopeProjectIds),

// ✅ ДОЛЖНО БЫТЬ:
private parseScopeProjectIds(scopeString: string): string[] {
  try {
    const parsed = JSON.parse(scopeString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    this.logger.error('Failed to parse token scope, returning empty array', error);
    return [];
  }
}

// В методе validateToken:
return {
  userId: token.userId,
  scopeProjectIds: this.parseScopeProjectIds(token.scopeProjectIds),
  tokenId: token.id,
};
```

---

## P1.2 - Rate Limiting

### 1. Установка пакета

```bash
pnpm add @nestjs/throttler
```

### 2. app.module.ts

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ... другие импорты
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 секунд
        limit: 1000, // 1000 запросов в минуту для обычных API
      },
      {
        name: 'external',
        ttl: 60000,
        limit: 100, // 100 запросов в минуту для External API
      },
      {
        name: 'automation',
        ttl: 60000,
        limit: 60, // 60 запросов в минуту для Automation API
      },
    ]),
  ],
  providers: [
    // Глобальный guard (можно отключить для конкретных endpoints)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 3. external.controller.ts

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('external')
@UseGuards(ApiTokenGuard)
@Throttle({ external: { limit: 100, ttl: 60000 } }) // Применяем лимит 'external'
export class ExternalController {
  // ... методы
}
```

### 4. automation.controller.ts

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('automation/v1')
@UseGuards(ApiTokenGuard)
@Throttle({ automation: { limit: 60, ttl: 60000 } }) // Применяем лимит 'automation'
export class AutomationController {
  // ... методы
}
```

---

## P1.3 - Проверка scope в schedule endpoint

### external.controller.ts

```typescript
/**
 * Schedule a publication to be posted to channels
 */
@Post('publications/schedule')
public async schedulePublication(
  @Request() req: ApiTokenRequest,
  @Body() dto: SchedulePublicationDto,
) {
  const { userId, scopeProjectIds } = req.user;

  // ✅ ДОБАВИТЬ: Получаем публикацию и проверяем scope
  const publication = await this.publicationsService.findOne(
    dto.publicationId,
    userId,
  );
  
  // Проверяем, что проект публикации входит в scope токена
  ApiTokenGuard.validateProjectScope(publication.projectId, scopeProjectIds);

  return this.publicationsService.createPostsFromPublication(
    dto.publicationId,
    dto.channelIds,
    userId,
    dto.scheduledAt,
  );
}
```

---

## P1.4 - Optimistic Locking для claim post

### 1. Обновить schema.prisma

```prisma
model Post {
  id            String       @id @default(uuid())
  // ... остальные поля
  version       Int          @default(0) // ✅ ДОБАВИТЬ
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  // ... relations
}
```

### 2. Создать миграцию

```bash
npx prisma migrate dev --name add_post_version
```

### 3. Обновить automation.service.ts

```typescript
public async claimPost(postId: string, userId: string, scopeProjectIds: string[]) {
  this.logger.log(`Claiming post ${postId} by user ${userId}`);

  return this.prisma.$transaction(
    async tx => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        include: {
          channel: true,
          publication: true,
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Security checks...
      const projectId = post.channel.projectId;
      if (scopeProjectIds.length > 0 && !scopeProjectIds.includes(projectId)) {
        throw new ForbiddenException('Access denied: Project not in token scope');
      }

      const member = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!member) {
        throw new ForbiddenException('Access denied: User is not a member of this project');
      }

      if (post.status !== PostStatus.SCHEDULED) {
        throw new BadRequestException('Post is not scheduled');
      }

      const meta = this.parsePostMeta(post.meta, postId);
      if (meta.processing) {
        throw new ConflictException('Post is already being processed');
      }

      // ✅ OPTIMISTIC LOCKING: Обновляем только если version совпадает
      const updatedPosts = await tx.post.updateMany({
        where: {
          id: postId,
          version: post.version, // Проверяем версию
        },
        data: {
          version: post.version + 1, // Инкрементируем версию
          meta: JSON.stringify({
            ...meta,
            processing: true,
            claimedBy: userId,
            claimedAt: new Date().toISOString(),
          }),
        },
      });

      // Если не обновлено ни одной записи - значит версия изменилась
      if (updatedPosts.count === 0) {
        throw new ConflictException('Post is already being processed by another worker');
      }

      // Возвращаем обновленный пост
      return tx.post.findUnique({
        where: { id: postId },
        include: {
          channel: true,
          publication: true,
        },
      });
    },
    {
      maxWait: 5000, // P1.5: Добавляем timeout
      timeout: 10000,
    },
  );
}

// ✅ ДОБАВИТЬ helper метод
private parsePostMeta(metaString: string, postId: string): any {
  try {
    return JSON.parse(metaString);
  } catch (error) {
    this.logger.error(`Failed to parse post meta for post ${postId}`, error);
    return {};
  }
}
```

---

## P1.5 - Timeout для транзакций

### projects.service.ts

```typescript
public async create(userId: string, data: CreateProjectDto): Promise<Project> {
  this.logger.log(`Creating project "${data.name}" for user ${userId}`);

  return this.prisma.$transaction(
    async tx => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: ProjectRole.OWNER,
        },
      });

      return project;
    },
    {
      maxWait: 5000, // ✅ ДОБАВИТЬ: 5 секунд на ожидание начала транзакции
      timeout: 10000, // ✅ ДОБАВИТЬ: 10 секунд на выполнение
    },
  );
}
```

---

## P1.6 - Проверка пустого channelIds

### publications.service.ts

```typescript
public async createPostsFromPublication(
  publicationId: string,
  channelIds: string[],
  userId?: string,
  scheduledAt?: Date,
) {
  // ✅ ДОБАВИТЬ: Проверка на пустой массив
  if (!channelIds || channelIds.length === 0) {
    throw new BadRequestException('At least one channel must be specified');
  }

  // Остальной код без изменений...
  let publication;

  if (userId) {
    publication = await this.findOne(publicationId, userId);
  } else {
    publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new NotFoundException('Publication not found');
    }
  }

  // ... остальной код
}
```

---

## P1.7 - Индекс для telegramUsername

### 1. Обновить schema.prisma

```prisma
model User {
  id         String   @id @default(uuid())

  fullName   String?  @map("full_name")
  telegramUsername String? @map("telegram_username")
  avatarUrl  String?  @map("avatar_url")
  telegramId BigInt?  @unique @map("telegram_id")
  isAdmin    Boolean  @default(false) @map("is_admin")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  preferences String   @default("{}") // Store as JSON string in SQLite

  ownedProjects  Project[]       @relation("ProjectOwner")
  projectMembers ProjectMember[]
  posts          Post[]
  publications   Publication[]
  apiTokens      ApiToken[]

  @@index([telegramUsername]) // ✅ ДОБАВИТЬ
  @@map("users")
}
```

### 2. Создать миграцию

```bash
npx prisma migrate dev --name add_telegram_username_index
```

### 3. Проверить индекс

```bash
sqlite3 ./test-data/grand-publicador.db
.schema users
# Должен быть: CREATE INDEX "users_telegram_username_idx" ON "users"("telegram_username");
```

---

## Проверка после внедрения

### 1. Запустить тесты

```bash
pnpm test:unit
pnpm test:e2e
```

### 2. Проверить линтинг

```bash
pnpm lint
```

### 3. Проверить миграции

```bash
npx prisma migrate status
```

### 4. Нагрузочное тестирование rate limiting

```bash
# Установить k6 или Apache Bench
ab -n 200 -c 10 http://localhost:8080/api/v1/external/publications

# Должно вернуть 429 Too Many Requests после 100 запросов
```

---

## Итоговый чек-лист

- [ ] P1.1: Добавлены try-catch для всех JSON.parse
- [ ] P1.2: Установлен и настроен @nestjs/throttler
- [ ] P1.3: Добавлена проверка scope в schedule endpoint
- [ ] P1.4: Добавлено поле version и optimistic locking
- [ ] P1.5: Добавлены timeout для всех транзакций
- [ ] P1.6: Добавлена проверка пустого channelIds
- [ ] P1.7: Создан индекс для telegramUsername
- [ ] Все тесты проходят
- [ ] Миграции применены
- [ ] Rate limiting протестирован
