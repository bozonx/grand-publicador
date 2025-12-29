# Grand Publicador (NestJS + Nuxt 4)

Современная платформа для управления блогами, каналами и публикациями в социальных сетях (Telegram и др.) в формате Telegram Mini App.

## Технологический стек

### Бэкенд
- **NestJS** + **Fastify** — высокая производительность и модульность.
- **Prisma** + **SQLite** — типобезопасная работа с данными.
- **JWT Auth** — авторизация на основе подписи Telegram.

### Фронтенд
- **Nuxt 4** (SSR: false) — современный Vue-фреймворк.
- **Nuxt UI** — стильный и быстрый интерфейс.
- **Pinia** — управление состоянием.

## Быстрый старт

Требования:
- Node.js 22.x
- pnpm 10.x

```bash
# 1) Установка зависимостей в корне и в ui/
pnpm install
cd ui && pnpm install && cd ..

# 2) Настройка окружения
cp .env.development.example .env

# 3) Тенерирование Prisma Client
npx prisma generate

# 4) Запуск в режиме разработки
# Бэкенд:
npm run start:dev
# Фронтенд:
cd ui && npm run dev
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Путь к БД SQLite (например, `file:./dev.db`) |
| `JWT_SECRET` | Соль для подписи JWT токенов |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather для валидации данных |
| `API_KEY` | API ключ для External и Automation API |
| `VITE_DEV_MODE` | `true` для пропуска проверки подписи Telegram в dev-режиме |
| `VITE_DEV_TELEGRAM_ID` | Mock ID пользователя для dev-режима |

## Как получить JWT-токен

Для работы с защищенным API (`/api/v1/...`) необходим `access_token` в заголовке `Authorization: Bearer <TOKEN>`.

### В приложении (автоматически):
При открытии Mini App фронтенд берет `initData` из Telegram SDK и отправляет запрос на:
`POST /api/v1/auth/telegram`
```json
{
  "initData": "user=%7B%22id%22%3A123...&hash=..."
}
```
В ответ приходит объект с `access_token`, который сохраняется в куках.

### Через API (для тестов):
Если включен `VITE_DEV_MODE=true`, сервер принимает моковые данные. Вы можете отправить любой `initData` (даже пустой, если бэкенд настроен пропускать валидацию — см. `AuthService`), чтобы получить токен для `VITE_DEV_TELEGRAM_ID`.

Для реальной авторизации используйте `initData`, скопированный из консоли Mini App:
```bash
curl -X POST http://localhost:8080/api/v1/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData": "PASTE_YOUR_INIT_DATA_HERE"}'
```

## API Endpoints

### UI API (требует JWT auth)
- **Projects**: `/api/v1/projects` - управление проектами
- **Channels**: `/api/v1/channels` - управление каналами
- **Publications**: `/api/v1/publications` - управление публикациями
- **Posts**: `/api/v1/posts` - управление постами

### External API (требует API Key)
Для интеграции с n8n и другими системами автоматизации:
- `POST /api/external/v1/publications` - создание публикации
- `POST /api/external/v1/publications/:id/schedule` - планирование публикации

См. [External API Documentation](docs/EXTERNAL_API.md)

### Automation API (требует API Key)
Для автоматической публикации по расписанию:
- `GET /api/automation/v1/posts/pending` - получить посты готовые к публикации
- `POST /api/automation/v1/posts/:id/claim` - забрать пост для публикации
- `PATCH /api/automation/v1/posts/:id/status` - обновить статус после публикации

См. [Automation API Documentation](docs/AUTOMATION_API.md)

## Структура проекта
- `src/` — исходный код NestJS.
- `ui/` — исходный код Nuxt 4.
- `prisma/` — схемы и миграции базы данных.

## Лицензия
MIT

