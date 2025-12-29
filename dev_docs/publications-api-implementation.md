# План реализации API для Publications

## Цель
Доработать бэкенд для реализации MVP системы управления публикациями в социальных сетях с поддержкой:
1. UI API - для управления публикациями через веб-интерфейс
2. External API - для добавления постов из n8n и других автоматизаций
3. Automation API - для получения постов по расписанию для публикации

## Текущее состояние

### Проблемы в существующем коде:
1. **Несоответствие схеме Prisma**: код использует `Blog`/`BlogMember`, а схема определяет `Project`/`ProjectMember`
2. **Отсутствие модуля Publications**: есть только Posts, но нет Publications (которые являются источником для постов)
3. **Нет External API**: отсутствует публичный API для внешних систем
4. **Нет Automation API**: нет эндпоинтов для получения постов по расписанию

### Архитектура из схемы:
- **Publication** - основная сущность с контентом, может быть опубликована в несколько каналов
- **Post** - конкретная публикация в канале, связана с Publication
- **Project** - группировка каналов (ранее Blog)
- **Channel** - канал в соцсети

## Этапы реализации

### Этап 1: Приведение кода в соответствие со схемой Prisma
- [ ] Переименовать `BlogsModule` → `ProjectsModule`
- [ ] Обновить все ссылки на `Blog` → `Project`, `BlogMember` → `ProjectMember`
- [ ] Обновить сервисы и контроллеры
- [ ] Обновить роуты `/api/v1/blogs` → `/api/v1/projects`

### Этап 2: Создание модуля Publications
- [ ] Создать `PublicationsModule` с CRUD операциями
- [ ] Реализовать связь Publication → Post (один ко многим)
- [ ] Добавить методы для работы с медиафайлами
- [ ] Добавить фильтрацию по статусу (DRAFT, SCHEDULED, PUBLISHED, FAILED)

### Этап 3: Обновление модуля Posts
- [ ] Обновить Posts для работы с Publications
- [ ] Добавить поддержку `publicationId`
- [ ] Реализовать автоматическое создание постов из публикации

### Этап 4: External API для n8n
Создать отдельный контроллер с API key аутентификацией:
- [ ] `POST /api/external/v1/publications` - создание публикации
- [ ] `POST /api/external/v1/publications/:id/posts` - создание постов для публикации
- [ ] Middleware для проверки API key
- [ ] Документация для n8n

### Этап 5: Automation API
API для автоматизации публикаций:
- [ ] `GET /api/automation/v1/posts/pending` - получить посты готовые к публикации
  - Фильтр по времени (scheduledAt <= now)
  - Фильтр по статусу (SCHEDULED)
  - Пагинация
- [ ] `POST /api/automation/v1/posts/:id/claim` - забрать пост для публикации
  - Атомарная операция с блокировкой
- [ ] `PATCH /api/automation/v1/posts/:id/status` - обновить статус после публикации
  - PUBLISHED / FAILED
  - Добавить publishedAt timestamp

### Этап 6: Миграция базы данных
- [ ] Создать миграцию для приведения БД в соответствие со схемой
- [ ] Добавить индексы для оптимизации запросов:
  - `scheduledAt` для Automation API
  - `status` для фильтрации
  - `projectId` для быстрого доступа

## API Endpoints

### UI API (требует JWT auth)
```
# Projects (ранее Blogs)
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

# Channels
GET    /api/v1/channels?projectId=xxx
POST   /api/v1/channels
GET    /api/v1/channels/:id
PATCH  /api/v1/channels/:id
DELETE /api/v1/channels/:id

# Publications (новое)
GET    /api/v1/publications?projectId=xxx&status=xxx
POST   /api/v1/publications
GET    /api/v1/publications/:id
PATCH  /api/v1/publications/:id
DELETE /api/v1/publications/:id

# Posts
GET    /api/v1/posts?channelId=xxx&publicationId=xxx
POST   /api/v1/posts
GET    /api/v1/posts/:id
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
```

### External API (требует API Key)
```
POST   /api/external/v1/publications
POST   /api/external/v1/publications/:id/schedule
```

### Automation API (требует API Key)
```
GET    /api/automation/v1/posts/pending?limit=10
POST   /api/automation/v1/posts/:id/claim
PATCH  /api/automation/v1/posts/:id/status
```

## Модели данных

### Publication
```typescript
{
  id: string
  projectId: string
  authorId?: string
  title?: string
  content: string
  mediaFiles: string[] // JSON array
  tags?: string
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
  meta: object // JSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Post
```typescript
{
  id: string
  publicationId?: string
  channelId: string
  authorId?: string
  content?: string
  socialMedia: string
  postType: 'POST' | 'ARTICLE' | 'NEWS' | 'VIDEO' | 'SHORT' | 'STORY'
  title?: string
  description?: string
  authorComment?: string
  tags?: string
  mediaFiles: string[] // JSON array
  postDate?: DateTime
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
  scheduledAt?: DateTime
  publishedAt?: DateTime
  meta: object // JSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Безопасность

### API Key Authentication
- Создать таблицу `ApiKey` для хранения ключей
- Генерировать ключи с префиксом (например, `gp_live_...`, `gp_test_...`)
- Хранить хэш ключа, не сам ключ
- Поддержка разных scope (external, automation)

### Rate Limiting
- Добавить rate limiting для External и Automation API
- Использовать Redis или in-memory cache

## Тестирование
- [ ] Unit тесты для новых сервисов
- [ ] E2E тесты для всех API endpoints
- [ ] Тесты для проверки прав доступа

## Документация
- [ ] Обновить README.md
- [ ] Создать API документацию для External API
- [ ] Создать примеры для n8n
