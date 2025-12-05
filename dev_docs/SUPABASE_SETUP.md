# Supabase Setup Guide

## Шаг 1: Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите или создайте аккаунт
3. Нажмите "New Project"
4. Заполните данные:
   - **Name**: `grand-publicador-dev` (для development)
   - **Database Password**: создайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший регион
5. Нажмите "Create new project"
6. Дождитесь завершения создания проекта (~2 минуты)

## Шаг 2: Получение API ключей

1. В панели Supabase перейдите в **Settings** → **API**
2. Скопируйте следующие значения:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (это публичный ключ для клиента)

## Шаг 3: Настройка переменных окружения

1. Откройте файл `.env.development` в корне проекта
2. Замените placeholder значения на реальные:

```env
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_KEY=ваш-anon-public-ключ
```

3. Сохраните файл

## Шаг 4: Создание схемы базы данных

На следующем шаге (Шаг 4 плана реализации) мы создадим:
- Таблицы: `users`, `blogs`, `blog_members`, `channels`, `posts`
- ENUM типы: `blog_role`, `social_media_enum`, `post_type_enum`
- RLS (Row Level Security) политики
- Seed данные для тестирования

## Проверка подключения

После настройки переменных окружения, перезапустите dev сервер:

```bash
pnpm dev
```

Если все настроено правильно, вы не увидите ошибок подключения к Supabase.

## Полезные ссылки

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [@nuxtjs/supabase Module](https://supabase.nuxtjs.org/)

## Troubleshooting

### Ошибка: "Invalid API key"
- Убедитесь, что вы скопировали **anon public** ключ, а не service_role ключ
- Проверьте, что в ключе нет лишних пробелов

### Ошибка: "Failed to fetch"
- Проверьте правильность SUPABASE_URL
- Убедитесь, что проект Supabase активен и доступен

### Ошибка: "CORS policy"
- В настройках Supabase (Authentication → URL Configuration) добавьте `http://localhost:3000` в Site URL

---

**Следующий шаг**: Создание схемы базы данных (Шаг 4)
