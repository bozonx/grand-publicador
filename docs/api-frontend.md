# API Фронтенда (UI)

Документация по REST API, используемому веб-интерфейсом (Vue/Nuxt приложением).

## Аутентификация

API использует JWT токены для идентификации пользователей.

- **Заголовок:** `Authorization: Bearer <ваш_jwt_токен>`
- Токен выдается после успешного входа через Telegram.

### Вход через Telegram
Аутентифицирует пользователя, используя данные инициализации (initData) от Telegram Mini Apps или Widget.

- **Endpoint:** `POST /api/auth/telegram`
- **Body:** `{ "initData": "string_from_telegram_sdk" }`
- **Response:** JWT токен (accessToken).

### Получение профиля
Возвращает информацию о текущем авторизованном пользователе.

- **Endpoint:** `GET /api/auth/me`
- **Response:** Объект пользователя (id, username, fullName и т.д.).

---

## Проекты (Projects)

Управление проектами (группами блогов/каналов).

### Список всех проектов
- **GET** `/api/projects`
- **Параметры:** `?limit=50&offset=0`

### Создание проекта
- **POST** `/api/projects`
- **Body:** `{ "name": "Название проекта", "description": "Описание" }`

### Получение одного проекта
- **GET** `/api/projects/:id`

### Обновление проекта
- **PATCH** `/api/projects/:id`
- **Body:** `{ "name": "...", "description": "..." }`

### Удаление проекта
- **DELETE** `/api/projects/:id`

---

## Каналы (Channels)

Управление каналами внутри проектов (Telegram каналы, соцсети и т.д.).

### Список каналов проекте
- **GET** `/api/channels`
- **Параметры:** `?projectId=<uuid>` (Обязательно)

### Добавление канала
- **POST** `/api/channels`
- **Body:**
  ```json
  {
    "projectId": "uuid",
    "name": "Название канала",
    "providerId": "-100123123123", // ID канала в Telegram
    "socialMedia": "TELEGRAM"
    // "settings": { ... } // Доп. настройки
  }
  ```

### Обновление канала
- **PATCH** `/api/channels/:id`

### Удаление канала
- **DELETE** `/api/channels/:id`

---

## Посты (Posts)

Управление конкретными постами в каналах. Пост - это экземпляр контента, привязанный к каналу.

### Список постов в канале
- **GET** `/api/posts`
- **Параметры:** `?channelId=<uuid>`

### Создание поста напрямую (редко используется, обычно через Публикации)
- **POST** `/api/posts`
- **Body:**
  ```json
  {
    "channelId": "uuid",
    "title": "Title",
    "content": "Content",
    "postType": "POST"
  }
  ```

### Детальный просмотр поста
- **GET** `/api/posts/:id`

### Редактирование поста
- **PATCH** `/api/posts/:id`

### Удаление поста
- **DELETE** `/api/posts/:id`

---

## Публикации (Publications)

Управление контентом. Публикация - это сущность, содержащая контент, который затем рассылается в каналы.

### Создание публикации (Черновик)
- **POST** `/api/publications`
- **Body:**
  ```json
  {
    "projectId": "uuid",
    "title": "Заголовок",
    "content": "Текст поста",
    "mediaFiles": ["url1", "url2"],
    "tags": "tag1,tag2",
    "status": "DRAFT" // или SCHEDULED
  }
  ```

### Список публикаций
- **GET** `/api/publications`
- **Параметры:** `?projectId=<uuid>&status=DRAFT&limit=20`

### Детальный просмотр
- **GET** `/api/publications/:id`
- Возвращает публикацию и список связанных постов (со статусами рассылки).

### Редактирование
- **PATCH** `/api/publications/:id`

### Удаление
- **DELETE** `/api/publications/:id`

### Создание постов (Рассылка)
Генерирует конкретные посты для выбранных каналов из этой публикации.

- **POST** `/api/publications/:id/posts`
- **Body:**
  ```json
  {
    "channelIds": ["cid1", "cid2"],
    "scheduledAt": "2024-05-20T10:00:00Z" // Опционально
  }
  ```
