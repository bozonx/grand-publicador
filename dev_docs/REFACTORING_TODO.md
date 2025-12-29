# План завершения рефакторинга

## ✅ ВЫПОЛНЕНО

1. **Обновление Prisma до v7**
   - Создан `prisma.config.ts`
   - Обновлен `schema.prisma`
   - Сгенерирован Prisma Client v7.2.0

2. **Централизация проверки прав**
   - Создан `PermissionsService`
   - Создан `PermissionsModule`
   - Рефакторинг `PublicationsService`

3. **Удаление мертвого кода**
   - Удален `prisma-enums.ts`

## 🔄 ТРЕБУЕТСЯ ЗАВЕРШИТЬ

### Критические исправления

#### 1. Добавить PermissionsModule в app.module.ts
```typescript
// src/app.module.ts
import { PermissionsModule } from './common/services/permissions.module.js';

@Module({
  imports: [
    // ... existing imports
    PermissionsModule, // Добавить после PrismaModule
    // ...
  ],
})
```

#### 2. Рефакторинг BlogsService
```typescript
// src/modules/blogs/blogs.service.ts
import { PermissionsService } from '../../common/services/permissions.service.js';
import { ProjectRole } from '@prisma/client';

constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService, // Добавить
) { }

// Заменить все вызовы:
// this.checkPermission(...) → this.permissions.checkProjectPermission(...)

// Удалить метод checkPermission (строки 94-104)

// Исправить findOne: добавить проверку владельца
async findOne(projectId: string, userId: string) {
    const role = await this.permissions.getUserProjectRole(projectId, userId);
    if (!role) {
        throw new ForbiddenException('You are not a member of this project');
    }
    // ... rest of the code
    return { ...project, role };
}
```

#### 3. Рефакторинг ChannelsService
```typescript
// src/modules/channels/channels.service.ts
import { PermissionsService } from '../../common/services/permissions.service.js';
import { ProjectRole } from '@prisma/client';

constructor(
    private prisma: PrismaService,
    private blogsService: BlogsService,
    private permissions: PermissionsService, // Добавить
) { }

// Заменить все вызовы:
await this.checkPermission(projectId, userId, ['OWNER', 'ADMIN', 'EDITOR']);
// →
await this.permissions.checkProjectPermission(
    projectId,
    userId,
    [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.EDITOR]
);

// Удалить метод checkPermission (строки 86-96)
```

#### 4. Рефакторинг PostsService
```typescript
// src/modules/posts/posts.service.ts
import { PermissionsService } from '../../common/services/permissions.service.js';
import { ProjectRole } from '@prisma/client';

constructor(
    private prisma: PrismaService,
    private channelsService: ChannelsService,
    private permissions: PermissionsService, // Добавить
) { }

// Заменить все вызовы checkPermission
// Удалить метод checkPermission (строки 124-134)
```

#### 5. Исправить External API
```typescript
// src/modules/external/external.controller.ts

// Вариант 1: Создать отдельный метод в PublicationsService
// publications.service.ts:
async createExternal(data: CreatePublicationDto) {
    // Без проверки прав - для внешнего API
    return this.prisma.publication.create({
        data: {
            projectId: data.projectId,
            authorId: null, // Явно null для внешних публикаций
            title: data.title,
            content: data.content,
            mediaFiles: JSON.stringify(data.mediaFiles || []),
            tags: data.tags,
            status: data.status || PostStatus.DRAFT,
            meta: JSON.stringify(data.meta || {}),
        },
    });
}

// external.controller.ts:
@Post('publications')
async createPublication(@Body() dto: CreateExternalPublicationDto) {
    return this.publicationsService.createExternal(dto);
}

// Аналогично для createPostsFromPublication
```

#### 6. Удалить неиспользуемые импорты

```typescript
// src/modules/auth/auth.service.ts
// Удалить: import { createHmac, createHash } from 'node:crypto';
// Оставить: import { createHmac } from 'node:crypto';

// src/modules/publications/publications.controller.ts
// Удалить из импорта: IsEnum, IsString
// Оставить: IsArray, IsDateString, IsNotEmpty, IsOptional
```

### Улучшения качества

#### 7. Улучшить типизацию
```typescript
// src/modules/automation/automation.service.ts:106
const updateData: Prisma.PostUpdateInput = {
    status,
    meta: JSON.stringify({
        ...meta,
        ...(error && { lastError: error }),
        updatedAt: new Date().toISOString(),
    }),
};

// src/common/guards/api-key.guard.ts:38
import type { FastifyRequest } from 'fastify';
private extractApiKey(request: FastifyRequest): string | undefined {
```

#### 8. Добавить валидацию

```typescript
// src/modules/publications/dto/create-publication.dto.ts
import { ArrayMinSize, ArrayUnique } from 'class-validator';

// В CreatePostsDto (publications.controller.ts):
@IsArray()
@ArrayMinSize(1, { message: 'At least one channel must be specified' })
@IsNotEmpty()
channelIds!: string[];

// Добавить валидатор для scheduledAt
import { IsDateString, MinDate } from 'class-validator';
import { Transform } from 'class-transformer';

@IsDateString()
@IsOptional()
@Transform(({ value }) => {
    const date = new Date(value);
    if (date < new Date()) {
        throw new Error('Scheduled date cannot be in the past');
    }
    return value;
})
scheduledAt?: Date;
```

#### 9. Исправить race condition в AutomationService

```typescript
// src/modules/automation/automation.service.ts
async claimPost(postId: string) {
    return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
            where: { id: postId },
            include: { channel: true, publication: true },
        });

        if (!post) {
            throw new Error('Post not found');
        }

        if (post.status !== PostStatus.SCHEDULED) {
            throw new Error('Post is not scheduled');
        }

        const meta = JSON.parse(post.meta);
        if (meta.processing) {
            throw new Error('Post is already being processed');
        }

        // Атомарное обновление внутри транзакции
        return tx.post.update({
            where: { id: postId },
            data: {
                meta: JSON.stringify({
                    ...meta,
                    processing: true,
                    claimedAt: new Date().toISOString(),
                }),
            },
            include: { channel: true, publication: true },
        });
    });
}
```

#### 10. Сделать postType динамическим

```typescript
// src/modules/publications/dto/create-publication.dto.ts
import { PostType } from '@prisma/client';

export class CreatePublicationDto {
    // ... existing fields
    
    @IsEnum(PostType)
    @IsOptional()
    postType?: PostType;
}

// src/modules/publications/publications.service.ts:198
postType: data.postType || PostType.POST,
```

#### 11. Исправить дублирование владельца в BlogsService

```typescript
// Вариант 1: Не создавать ProjectMember для владельца
async create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.project.create({
        data: {
            name: data.name,
            description: data.description,
            ownerId: userId,
        },
    });
}

// Вариант 2: Использовать только ProjectMember
// Убрать поле ownerId из схемы и определять владельца через роль OWNER
// (требует миграции БД)
```

## Команды для проверки

```bash
# Перезапустить TypeScript server
# В VSCode: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Проверить сборку
npm run build

# Запустить тесты
npm run test:unit

# Проверить линтер
npm run lint
```

## Итоговая статистика после завершения

- Удалено ~150 строк дублирующегося кода
- Создано 3 новых файла
- Удален 1 неиспользуемый файл
- Улучшена типобезопасность
- Устранены логические ошибки
- Обновлена версия Prisma

