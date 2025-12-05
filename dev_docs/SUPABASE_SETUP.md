# Local Supabase Setup Guide

## Обзор

Для разработки мы используем **Local Supabase** через Supabase CLI. Это обеспечивает:
- ✅ Полную идентичность dev и production окружений
- ✅ Работу без интернета
- ✅ Быструю разработку и тестирование
- ✅ Все фичи Supabase локально (Auth, Storage, Realtime, Edge Functions)

## Предварительные требования

1. **Docker Desktop** должен быть установлен и запущен
   - [Скачать Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - После установки запустите Docker Desktop

2. **Node.js 18+** и **pnpm** уже установлены

## Шаг 1: Инициализация Supabase CLI

```bash
# Инициализация Supabase в проекте
npx supabase init

# Это создаст директорию supabase/ с конфигурацией
```

Структура созданных файлов:
```
supabase/
├── config.toml          # Конфигурация Local Supabase
├── seed.sql            # Seed данные (создается вручную)
└── migrations/         # SQL миграции
```

## Шаг 2: Запуск Local Supabase

```bash
# Запуск всех Supabase сервисов в Docker
npx supabase start
```

**Первый запуск займет ~2-3 минуты** (скачивание Docker images).

После успешного запуска вы увидите:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Шаг 3: Настройка переменных окружения

Файл `.env.development` уже настроен с дефолтными Local Supabase credentials:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Примечание:** Эти credentials одинаковые для всех Local Supabase инстансов.

## Шаг 4: Проверка подключения

```bash
# Перезапустите dev сервер
pnpm dev
```

Откройте http://localhost:3000 - компонент **Supabase Connection Status** должен показать зеленый индикатор.

## Полезные команды

### Управление Local Supabase

```bash
# Запуск
npx supabase start

# Остановка
npx supabase stop

# Перезапуск
npx supabase stop && npx supabase start

# Статус
npx supabase status

# Полная очистка (удаление всех данных)
npx supabase stop --no-backup
```

### Работа с миграциями

```bash
# Создание новой миграции
npx supabase migration new migration_name

# Применение миграций
npx supabase db reset

# Применение только новых миграций
npx supabase db push
```

### Генерация TypeScript типов

```bash
# Из локальной БД
npx supabase gen types typescript --local > app/types/database.types.ts
```

### Supabase Studio

Откройте http://localhost:54323 для доступа к Supabase Studio:
- Просмотр таблиц и данных
- SQL Editor
- Управление Auth пользователями
- Просмотр Storage
- Настройка RLS политик

## Workflow разработки

1. **Запустите Local Supabase:**
   ```bash
   npx supabase start
   ```

2. **Создайте миграцию:**
   ```bash
   npx supabase migration new add_users_table
   ```

3. **Напишите SQL в файле миграции:**
   ```sql
   -- supabase/migrations/XXXXXX_add_users_table.sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL
   );
   ```

4. **Примените миграцию:**
   ```bash
   npx supabase db reset
   ```

5. **Сгенерируйте типы:**
   ```bash
   npx supabase gen types typescript --local > app/types/database.types.ts
   ```

6. **Разрабатывайте приложение:**
   ```bash
   pnpm dev
   ```

## Деплой в Production

Когда готовы к деплою:

1. **Создайте production проект в Supabase Cloud:**
   - Перейдите на [supabase.com](https://supabase.com)
   - Создайте новый проект

2. **Линк локального проекта с production:**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Деплой миграций:**
   ```bash
   npx supabase db push
   ```

4. **Обновите production env variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-production-anon-key
   ```

## Troubleshooting

### Docker не запущен
```
Error: Cannot connect to the Docker daemon
```
**Решение:** Запустите Docker Desktop

### Порты заняты
```
Error: port 54321 is already in use
```
**Решение:** Остановите другие Supabase инстансы или измените порты в `supabase/config.toml`

### Миграции не применяются
```bash
# Полный сброс БД
npx supabase db reset
```

### Нужно очистить все данные
```bash
# Остановка с удалением volumes
npx supabase stop --no-backup
npx supabase start
```

## Полезные ссылки

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase Studio](https://supabase.com/docs/guides/platform/studio)

---

**Следующий шаг**: Создание схемы базы данных (Шаг 4 плана реализации)
