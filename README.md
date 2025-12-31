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

### 1) Установка зависимостей
```bash
# Установка зависимостей в корне (бэкенд)
pnpm install

# Установка зависимостей во фронтенде
cd ui && pnpm install && cd ..
```

### 2) Настройка окружения
```bash
# Для разработки
cp .env.development.example .env

# Для продакшн
# cp .env.production.example .env
```
_Отредактируйте `.env`, указав ваш `TELEGRAM_BOT_TOKEN` и другие параметры._

### 3) Инициализация базы данных (Prisma)
Команда создаст файл БД (SQLite), накатит миграции и сгенерирует клиент.

**Важно:** Используйте `prisma-wrapper.mjs` для всех Prisma команд, чтобы автоматически установить DATABASE_URL из DATA_DIR.

```bash
# Для разработки (создает миграцию)
node prisma-wrapper.mjs migrate dev --name init

node prisma-wrapper.mjs migrate deploy
# Наполнение базы тестовыми данными (опционально)
node prisma-wrapper.mjs db seed

# Только генерация клиента (если БД уже есть)
npx prisma generate
```

## Режимы запуска

### Разработка (Development)
Запуск с hot-reload для бэкенда и фронтенда.

**Бэкенд:**
```bash
npm run start:dev
```
Сервер будет доступен на `http://localhost:8080`.

**Фронтенд:**
```bash
cd ui
pnpm dev
```
Интерфейс будет доступен на `http://localhost:3000`.

### Продакшн (Production)

**Рекомендуемый способ: Docker**

См. подробное руководство: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Быстрый старт:
```bash
cd docker
# Отредактируйте docker-compose.yml (JWT_SECRET, TELEGRAM_BOT_TOKEN)
docker-compose up -d
```

Приложение будет доступно на `http://localhost:8080`

**Альтернатива: Ручная сборка**

Бэкенд:
```bash
pnpm build
node prisma-wrapper.mjs migrate deploy
pnpm start:prod
```

Фронтенд:
```bash
cd ui
pnpm build
# Статика будет в ui/.output/public и раздается бэкендом
```


## Конфигурация

Приложение использует YAML-файл для хранения основных настроек. Рабочий файл находится в папке `DATA_DIR/app-config.yaml`.
Система поддерживает:
- **Hot Reload** — изменения применяются мгновенно без перезапуска сервера.
- **Интерфейс управления** — редактирование доступно в панели администратора.
- **Env substitution** — использование `${VAR_NAME}` внутри YAML.

Подробнее см. [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Переменные окружения

Эти переменные используются для инициализации дефолтного конфига и могут быть переопределены в `app-config.yaml`.

| Переменная | Описание |
|------------|----------|
| `DATA_DIR` | Папка для данных (БД, конфиг и др.) |
| `JWT_SECRET` | Соль для JWT (используется как `${JWT_SECRET}` в конфиге) |
| `TELEGRAM_BOT_TOKEN` | Токен бота (используется как `${TELEGRAM_BOT_TOKEN}` в конфиге) |
| `TELEGRAM_ADMIN_ID` | Telegram ID главного администратора |
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

### External API (требует пользовательский API токен)
Для интеграции с n8n и другими системами автоматизации:
- `POST /api/external/publications` - создание публикации
- `POST /api/external/publications/schedule` - планирование публикации

**Создание токенов**: Пользователи создают API токены через Настройки > API Tokens в UI.

См. [External API Documentation](docs/api-external.md)

### Automation API (требует пользовательский API токен)
Для автоматической публикации по расписанию:
- `GET /api/automation/v1/posts/pending` - получить посты готовые к публикации
- `POST /api/automation/v1/posts/:id/claim` - забрать пост для публикации
- `PATCH /api/automation/v1/posts/:id/status` - обновить статус после публикации

См. [Automation API Documentation](docs/api-external.md)

### Archive API (требует JWT auth)
Для управления архивированным контентом с виртуальным каскадированием:
- `POST /archive/:type/:id` - архивировать сущность
- `POST /archive/:type/:id/restore` - восстановить из архива
- `DELETE /archive/:type/:id` - окончательное удаление
- `POST /archive/:type/:id/move` - переместить сущность
- `GET /archive/stats` - статистика архива
- `GET /archive/:type` - список архивных элементов

См. [Archive API Documentation](docs/api-archive.md)

## Структура проекта
- `src/` — исходный код NestJS.
- `ui/` — исходный код Nuxt 4.
- `prisma/` — схемы и миграции базы данных.

## Лицензия
MIT

