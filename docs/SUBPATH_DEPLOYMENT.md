# Инструкция по настройке деплоя (корень или subpath)

## Проблема
- API работает: `https://services-gp.p-libereco.org/api/v1/health` ✅
- Frontend не работает: `https://services-gp.p-libereco.org/` ❌ (404)

## Причина
Две проблемы:
1. **Nuxt использовал `build` вместо `generate`** - создавался SSR build вместо полностью статического сайта
2. **Отсутствовал SPA fallback** - NestJS не возвращал `200.html` для клиентских маршрутов

## Решение

### Что было исправлено в коде:

1. **GitHub Actions workflow** - изменена команда с `pnpm build` на `pnpm generate`
2. **main.ts** - добавлен `setNotFoundHandler` для возврата `200.html` для всех не-API маршрутов
3. **nuxt.config.ts** - добавлен `baseURL` для поддержки deployment под subpath (опционально)



### Для деплоя в корне (/)

Просто пересоберите и задеплойте новый Docker образ:

```bash
# Запустите новый build в GitHub Actions (push в main)
git push origin main

# На сервере обновите образ
docker-compose pull
docker-compose up -d
```

### Для деплоя под subpath (например, /gran-p/)

1. **Настройте GitHub Actions переменную**:
   - Перейдите в **Settings** → **Secrets and variables** → **Actions** → **Variables**
   - Создайте переменную `NUXT_APP_BASE_URL` со значением `/gran-p/`

2. **Пересоберите и задеплойте**:
   ```bash
   # Запустите новый build в GitHub Actions
   git push origin main
   
   # На сервере обновите образ
   docker-compose pull
   docker-compose up -d
   ```

## Технические детали изменений

1. **ui/nuxt.config.ts**: Добавлен `baseURL: process.env.NUXT_APP_BASE_URL || '/'`
2. **src/main.ts**: Добавлен `setNotFoundHandler` для SPA fallback на `200.html`
3. **.github/workflows/docker-image.yml**: 
   - Изменена команда с `pnpm build` на `pnpm generate`
   - Добавлена env переменная `NUXT_APP_BASE_URL`
4. **docs/DEPLOYMENT.md**: Добавлена секция "Deploying Under a Subpath"

## Проверка

После деплоя проверьте:
- `https://services-gp.p-libereco.org/` - должен показать frontend ✅
- `https://services-gp.p-libereco.org/api/v1/health` - должен продолжать работать ✅

Или для subpath:
- `https://services-gp.p-libereco.org/gran-p/` - должен показать frontend ✅
- `https://services-gp.p-libereco.org/gran-p/api/v1/health` - должен продолжать работать ✅

## Важно

`NUXT_APP_BASE_URL` должен быть установлен **во время сборки** (build-time), а не во время запуска (runtime).

