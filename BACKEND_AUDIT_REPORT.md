# Отчет по аудиту структуры и именования бэкенда

**Дата:** 29 декабря 2025  
**Проект:** Grand Publicador (NestJS Backend)  
**Версия:** 0.1.0  
**Фреймворк:** NestJS 11.x + Fastify + Prisma 7.x

---

## Резюме

Проект представляет собой современный NestJS бэкенд для управления публикациями в социальных сетях. В целом архитектура следует best practices NestJS, но выявлены проблемы в организации кода, типизации и именовании сущностей.

**Общая оценка:** 7/10

---

## 🔴 Критические проблемы

### 1. **Несоответствие доменной модели и именования**

**Проблема:** Модуль называется `blogs`, но в Prisma схеме и сервисе используется сущность `Project`.

**Местоположение:**
- `src/modules/blogs/` - название модуля
- `prisma/schema.prisma` - модель `Project`
- `src/modules/blogs/blogs.service.ts` - работает с `Project`
- `src/modules/blogs/blogs.controller.ts` - контроллер `@Controller('blogs')`

**Влияние:** Критическое - создает путаницу в понимании доменной модели.

**Рекомендация:**
```typescript
// Вариант 1: Переименовать модуль blogs → projects
src/modules/projects/
  - projects.controller.ts
  - projects.service.ts
  - projects.module.ts

// Вариант 2: Переименовать модель Project → Blog в schema.prisma
// (требует миграции БД)
```

---

### 2. **DTO объявлены внутри контроллеров**

**Проблема:** DTO классы объявлены непосредственно в файлах контроллеров вместо отдельных файлов.

**Местоположение:**
- `src/modules/blogs/blogs.controller.ts` - `CreateBlogDto`, `UpdateBlogDto`
- `src/modules/channels/channels.controller.ts` - `CreateChannelDto`, `UpdateChannelDto`
- `src/modules/posts/posts.controller.ts` - `CreatePostDto`, `UpdatePostDto`
- `src/modules/publications/publications.controller.ts` - `CreatePostsDto`

**Влияние:** Критическое - нарушает принцип Single Responsibility, затрудняет переиспользование и тестирование.

**Рекомендация:**
```typescript
// Создать структуру:
src/modules/blogs/dto/
  - create-blog.dto.ts
  - update-blog.dto.ts
  - index.ts

// Аналогично для channels, posts
```

---

### 3. **Использование типа `any` в критических местах**

**Проблема:** Повсеместное использование `any` вместо строгой типизации.

**Местоположение:**
- Все контроллеры: `@Request() req: any` (40+ вхождений)
- `src/common/guards/api-key.guard.ts:38` - `request: any`
- `src/modules/automation/automation.service.ts:106` - `updateData: any`
- `src/modules/auth/jwt.strategy.ts:16` - `payload: any`
- DTO: `credentials?: any`, `mediaFiles?: any`, `meta?: Record<string, any>`

**Влияние:** Критическое - потеря type safety, невозможность автокомплита, риск runtime ошибок.

**Рекомендация:**
```typescript
// Вместо:
@Request() req: any

// Использовать:
import { FastifyRequest } from 'fastify';
@Request() req: FastifyRequest & { user: JwtPayload }

// Для DTO:
interface ChannelCredentials {
  token?: string;
  apiKey?: string;
  // ... другие поля
}

credentials?: ChannelCredentials;

// Для mediaFiles:
mediaFiles?: string[]; // или MediaFile[]

// Для updateData:
const updateData: Prisma.PostUpdateInput = { ... };
```

---

### 4. **Отсутствие интерфейса для JWT payload**

**Проблема:** Нет типизированного интерфейса для JWT payload, используется `any`.

**Местоположение:**
- `src/modules/auth/jwt.strategy.ts`
- Все контроллеры используют `req.user.userId` без типизации

**Влияние:** Критическое - отсутствие контроля типов для авторизации.

**Рекомендация:**
```typescript
// src/common/types/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;        // userId
  telegramId?: string;
  iat?: number;
  exp?: number;
}

// src/common/types/authenticated-request.interface.ts
import { FastifyRequest } from 'fastify';
import { JwtPayload } from './jwt-payload.interface.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

// В контроллерах:
@Request() req: AuthenticatedRequest
```

---

### 5. **Несогласованность в именовании переменных окружения**

**Проблема:** Переменные окружения используют разные префиксы и стили.

**Местоположение:**
- `.env.production.example`
- `src/config/app.config.ts`

**Примеры:**
```bash
LISTEN_HOST=...      # snake_case с префиксом LISTEN_
LISTEN_PORT=...
DATABASE_URL=...     # snake_case без префикса
JWT_SECRET=...       # SCREAMING_SNAKE_CASE
TELEGRAM_BOT_TOKEN=... # SCREAMING_SNAKE_CASE
VITE_DEV_MODE=...    # Префикс VITE_ для фронтенда в бэкенд .env
```

**Влияние:** Критическое - путаница при конфигурации, особенно `VITE_*` переменные в бэкенд .env.

**Рекомендация:**
```bash
# Использовать единый стиль SCREAMING_SNAKE_CASE
# Группировать по функциональности

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_BASE_PATH=

# Database
DATABASE_URL=file:/data/prod.db

# Authentication
AUTH_JWT_SECRET=...
AUTH_TELEGRAM_BOT_TOKEN=...
AUTH_API_KEY=...

# Logging
LOG_LEVEL=info

# Frontend (вынести в отдельный .env для UI)
# VITE_* переменные не должны быть в бэкенд .env
```

---

## 🟡 Рекомендуемые улучшения

### 6. **Дублирование логики владельца проекта**

**Проблема:** В схеме Prisma проект имеет `ownerId`, но также создается запись в `ProjectMember` с ролью `OWNER`.

**Местоположение:**
- `prisma/schema.prisma` - модель `Project` с полем `ownerId`
- `src/modules/blogs/blogs.service.ts:14-32` - создание проекта с дублированием

**Влияние:** Среднее - избыточность данных, потенциальная рассинхронизация.

**Рекомендация:**
```typescript
// Вариант 1: Убрать ProjectMember для владельца
// Владелец определяется через ownerId

// Вариант 2: Убрать ownerId, использовать только ProjectMember
// Владелец - это член с ролью OWNER
// (требует миграции БД и изменения логики)
```

---

### 7. **Отсутствие валидации для вложенных объектов**

**Проблема:** Поля `credentials`, `mediaFiles`, `meta` не имеют валидации структуры.

**Местоположение:**
- DTO в контроллерах channels, posts, publications

**Влияние:** Среднее - возможность передачи некорректных данных.

**Рекомендация:**
```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsObject } from 'class-validator';

class ChannelCredentialsDto {
  @IsString()
  @IsOptional()
  token?: string;
  
  @IsString()
  @IsOptional()
  apiKey?: string;
}

class CreateChannelDto {
  // ...
  @ValidateNested()
  @Type(() => ChannelCredentialsDto)
  @IsOptional()
  credentials?: ChannelCredentialsDto;
}
```

---

### 8. **Отсутствие валидации массивов**

**Проблема:** Массивы не проверяются на минимальное количество элементов и уникальность.

**Местоположение:**
- `src/modules/publications/publications.controller.ts:21-29` - `CreatePostsDto`
- `src/modules/external/dto/external.dto.ts:37-49` - `SchedulePublicationDto`

**Влияние:** Среднее - возможность передачи пустых массивов или дубликатов.

**Рекомендация:**
```typescript
import { ArrayMinSize, ArrayUnique, IsUUID } from 'class-validator';

class CreatePostsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one channel must be specified' })
  @ArrayUnique()
  @IsUUID('4', { each: true })
  channelIds!: string[];
  
  // ...
}
```

---

### 9. **Отсутствие валидации дат в прошлом**

**Проблема:** `scheduledAt` может быть установлена в прошлое время.

**Местоположение:**
- Все DTO с полем `scheduledAt`

**Влияние:** Среднее - создание постов с некорректным расписанием.

**Рекомендация:**
```typescript
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

class CreatePostsDto {
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const date = new Date(value);
    const now = new Date();
    if (date < now) {
      throw new Error('Scheduled date cannot be in the past');
    }
    return value;
  })
  scheduledAt?: Date;
}
```

---

### 10. **Неоптимальная обработка race condition**

**Проблема:** В `AutomationService.claimPost()` проверка и обновление не атомарны.

**Местоположение:**
- `src/modules/automation/automation.service.ts:41-85`

**Влияние:** Среднее - возможность одновременного захвата поста несколькими воркерами.

**Рекомендация:**
```typescript
// Текущий код уже использует транзакцию, но можно улучшить:
async claimPost(postId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Использовать SELECT FOR UPDATE (в PostgreSQL)
    // Или оптимистичную блокировку через версионирование
    
    const post = await tx.post.findUnique({
      where: { id: postId },
      include: { channel: true, publication: true },
    });

    if (!post) throw new Error('Post not found');
    if (post.status !== PostStatus.SCHEDULED) {
      throw new Error('Post is not scheduled');
    }

    const meta = JSON.parse(post.meta);
    if (meta.processing) {
      throw new Error('Post is already being processed');
    }

    return tx.post.update({
      where: { 
        id: postId,
        // Добавить условие для оптимистичной блокировки
        status: PostStatus.SCHEDULED,
      },
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

---

### 11. **Отсутствие индексов в Prisma схеме**

**Проблема:** Нет индексов для часто используемых полей в запросах.

**Местоположение:**
- `prisma/schema.prisma`

**Влияние:** Среднее - медленные запросы при росте данных.

**Рекомендация:**
```prisma
model Post {
  // ... existing fields
  
  @@index([status, scheduledAt]) // Для getPendingPosts
  @@index([channelId, createdAt]) // Для findAllForChannel
  @@index([publicationId])
  @@map("posts")
}

model Publication {
  // ... existing fields
  
  @@index([projectId, status])
  @@index([projectId, createdAt])
  @@map("publications")
}

model Channel {
  // ... existing fields
  
  @@index([projectId])
  @@map("channels")
}
```

---

### 12. **Жестко заданный `postType` в сервисе**

**Проблема:** При создании постов из публикаций `postType` всегда `POST`.

**Местоположение:**
- `src/modules/publications/publications.service.ts:198` (строка примерная)

**Влияние:** Среднее - невозможность создавать посты других типов из публикаций.

**Рекомендация:**
```typescript
// В CreatePublicationDto добавить:
@IsEnum(PostType)
@IsOptional()
postType?: PostType;

// В PublicationsService.createPostsFromPublication:
postType: publication.postType || PostType.POST,
```

---

### 13. **Отсутствие пагинации по умолчанию**

**Проблема:** Некоторые методы возвращают все записи без ограничений.

**Местоположение:**
- `src/modules/blogs/blogs.service.ts:35-51` - `findAllForUser`
- `src/modules/channels/channels.service.ts:38-48` - `findAllForProject`
- `src/modules/posts/posts.service.ts:52-58` - `findAllForChannel`

**Влияние:** Среднее - проблемы производительности при большом количестве данных.

**Рекомендация:**
```typescript
async findAllForUser(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  
  return this.prisma.project.findMany({
    where: { /* ... */ },
    take: limit,
    skip: offset,
    // ...
  });
}
```

---

## 🟢 Незначительные замечания

### 14. **Неиспользуемые импорты**

**Проблема:** В некоторых файлах есть неиспользуемые импорты.

**Местоположение:**
- `src/modules/publications/publications.controller.ts` - импортируется `IsEnum`, `IsString`, но не используется в контроллере

**Влияние:** Низкое - увеличение размера бандла.

**Рекомендация:** Удалить неиспользуемые импорты, настроить ESLint правило `no-unused-vars`.

---

### 15. **Отсутствие JSDoc комментариев**

**Проблема:** Большинство публичных методов не имеют JSDoc документации.

**Местоположение:** Все сервисы и контроллеры

**Влияние:** Низкое - затрудняет понимание API без чтения кода.

**Рекомендация:**
```typescript
/**
 * Creates a new project for the user
 * @param userId - ID of the user creating the project
 * @param data - Project creation data
 * @returns Created project
 * @throws {ForbiddenException} If user doesn't have permission
 */
async create(userId: string, data: CreateProjectDto): Promise<Project> {
  // ...
}
```

---

### 16. **Смешивание стилей именования в комментариях**

**Проблема:** Комментарии на английском, но некоторые сообщения об ошибках могут быть на русском (не обнаружено, но потенциальный риск).

**Влияние:** Низкое - несогласованность документации.

**Рекомендация:** Придерживаться английского языка для всех комментариев, JSDoc и сообщений об ошибках (согласно AGENTS.md).

---

### 17. **Отсутствие константы для роутов API**

**Проблема:** Версия API (`v1`) и префиксы (`automation/v1`, `external/v1`) жестко закодированы.

**Местоположение:**
- `src/main.ts:38` - `api/v1`
- `src/modules/automation/automation.controller.ts:21` - `automation/v1`
- `src/modules/external/external.controller.ts:13` - `external`

**Влияние:** Низкое - затруднение при изменении версии API.

**Рекомендация:**
```typescript
// src/common/constants/api.constants.ts
export const API_VERSION = 'v1';
export const API_PREFIX = 'api';
export const AUTOMATION_PREFIX = 'automation';
export const EXTERNAL_PREFIX = 'external';

// В main.ts:
const globalPrefix = `${API_PREFIX}/${API_VERSION}`;

// В контроллерах:
@Controller(`${AUTOMATION_PREFIX}/${API_VERSION}`)
```

---

### 18. **Отсутствие enum для магических строк**

**Проблема:** Строки `'jwt'`, `'processing'`, `'claimedAt'` используются как магические константы.

**Местоположение:**
- Все контроллеры: `@UseGuards(AuthGuard('jwt'))`
- `src/modules/automation/automation.service.ts` - `meta.processing`, `meta.claimedAt`

**Влияние:** Низкое - риск опечаток.

**Рекомендация:**
```typescript
// src/common/constants/auth.constants.ts
export const JWT_STRATEGY = 'jwt';

// src/common/constants/post-meta.constants.ts
export enum PostMetaFields {
  PROCESSING = 'processing',
  CLAIMED_AT = 'claimedAt',
  LAST_ERROR = 'lastError',
}

// Использование:
@UseGuards(AuthGuard(JWT_STRATEGY))

if (meta[PostMetaFields.PROCESSING]) { ... }
```

---

### 19. **Отсутствие логирования в критических местах**

**Проблема:** Нет логирования при захвате постов, обновлении статусов, ошибках авторизации.

**Местоположение:**
- `src/modules/automation/automation.service.ts`
- `src/modules/auth/auth.service.ts`

**Влияние:** Низкое - затруднение отладки в production.

**Рекомендация:**
```typescript
import { Logger } from '@nestjs/common';

export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  async claimPost(postId: string) {
    this.logger.log(`Claiming post ${postId}`);
    try {
      const result = await this.prisma.$transaction(/* ... */);
      this.logger.log(`Successfully claimed post ${postId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to claim post ${postId}`, error.stack);
      throw error;
    }
  }
}
```

---

### 20. **Отсутствие глобального exception filter для специфичных ошибок**

**Проблема:** Prisma ошибки (например, `P2025` - Record not found) не обрабатываются централизованно.

**Местоположение:**
- `src/common/filters/all-exceptions.filter.ts` - есть общий фильтр, но нет специфичной обработки Prisma ошибок

**Влияние:** Низкое - пользователи получают технические сообщения об ошибках.

**Рекомендация:**
```typescript
// src/common/filters/prisma-exception.filter.ts
import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    switch (exception.code) {
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
        });
        break;
      case 'P2002':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Unique constraint violation',
        });
        break;
      default:
        super.catch(exception, host);
    }
  }
}
```

---

## Структура проекта

### ✅ Соответствует best practices:

1. **Модульная архитектура** - каждый домен в отдельном модуле
2. **Разделение ответственности** - контроллеры, сервисы, модули
3. **Использование guards** - JWT и API Key аутентификация
4. **Централизованная обработка ошибок** - AllExceptionsFilter
5. **Конфигурация через ConfigModule** - типобезопасная конфигурация
6. **Использование Prisma** - типобезопасная работа с БД
7. **Логирование через Pino** - структурированное логирование
8. **Разделение API** - UI API (JWT), External API (API Key), Automation API (API Key)

### ❌ Требует улучшения:

1. **DTO организация** - вынести в отдельные файлы
2. **Типизация** - убрать `any`, добавить интерфейсы
3. **Именование** - согласовать `blogs` vs `projects`
4. **Валидация** - добавить для вложенных объектов и массивов
5. **Константы** - вынести магические строки в enum/константы

---

## Рекомендации по приоритетам

### Высокий приоритет (выполнить в первую очередь):

1. ✅ Переименовать модуль `blogs` → `projects` (или наоборот в схеме)
2. ✅ Вынести все DTO в отдельные файлы с структурой `dto/`
3. ✅ Создать интерфейсы `JwtPayload` и `AuthenticatedRequest`
4. ✅ Заменить `any` на конкретные типы в контроллерах и guards
5. ✅ Унифицировать переменные окружения

### Средний приоритет:

6. ✅ Добавить валидацию для массивов и вложенных объектов
7. ✅ Добавить индексы в Prisma схему
8. ✅ Добавить пагинацию во все list-методы
9. ✅ Решить проблему дублирования владельца проекта
10. ✅ Добавить валидацию дат (не в прошлом)

### Низкий приоритет:

11. ✅ Добавить JSDoc комментарии
12. ✅ Вынести константы для роутов и магических строк
13. ✅ Добавить логирование в критических местах
14. ✅ Создать Prisma exception filter
15. ✅ Настроить ESLint для удаления неиспользуемых импортов

---

## Заключение

Проект имеет хорошую базовую архитектуру, соответствующую best practices NestJS. Основные проблемы связаны с:

1. **Организацией кода** - DTO в контроллерах, несогласованное именование
2. **Типизацией** - чрезмерное использование `any`
3. **Валидацией** - недостаточная проверка входных данных

После устранения критических проблем проект будет соответствовать высоким стандартам качества enterprise-приложений на NestJS.

**Рекомендуемое время на рефакторинг:**
- Критические проблемы: 8-12 часов
- Рекомендуемые улучшения: 12-16 часов
- Незначительные замечания: 4-6 часов

**Итого:** 24-34 часа работы для полного устранения всех замечаний.
