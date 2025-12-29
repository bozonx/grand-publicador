# Инструкция по настройке деплоя под subpath

## Проблема
- API работает: `https://services-gp.p-libereco.org/gran-p/api/v1/health` ✅
- Frontend не работает: `https://services-gp.p-libereco.org/gran-p/` ❌ (404)

## Причина
Nuxt генерирует статические файлы для корневого пути `/`, а не для `/gran-p/`.

## Решение

### 1. Настройка GitHub Actions

В вашем репозитории на GitHub:
1. Перейдите в **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Создайте новую переменную:
   - Name: `NUXT_APP_BASE_URL`
   - Value: `/gran-p/`

### 2. Пересоберите Docker образ

После добавления переменной запустите новый build в GitHub Actions. Workflow автоматически использует эту переменную при сборке frontend.

### 3. Обновите Docker образ на сервере

```bash
# На вашем сервере
cd /path/to/your/deployment
docker-compose pull
docker-compose up -d
```

## Что было изменено в коде

1. **ui/nuxt.config.ts**: Добавлен `baseURL: process.env.NUXT_APP_BASE_URL || '/'`
2. **.github/workflows/docker-image.yml**: Добавлена env переменная `NUXT_APP_BASE_URL` в шаг сборки frontend
3. **ui/.env.production.example**: Добавлена документация для `NUXT_APP_BASE_URL`
4. **docs/DEPLOYMENT.md**: Добавлена секция "Deploying Under a Subpath"

## Проверка

После деплоя проверьте:
- `https://services-gp.p-libereco.org/gran-p/` - должен показать frontend ✅
- `https://services-gp.p-libereco.org/gran-p/api/v1/health` - должен продолжать работать ✅

## Важно

`NUXT_APP_BASE_URL` должен быть установлен **во время сборки** (build-time), а не во время запуска (runtime).
