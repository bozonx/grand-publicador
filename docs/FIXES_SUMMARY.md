# Резюме исправлений для деплоя frontend

## Проблема
Frontend возвращал 404 на всех маршрутах (кроме API).

## Корневая причина
1. **Использовался `nuxt build` вместо `nuxt generate`** - создавался SSR build, а не полностью статический сайт
2. **Отсутствовал SPA fallback** - для клиентских маршрутов не возвращался `200.html`

## Исправления

### 1. GitHub Actions Workflow (`.github/workflows/docker-image.yml`)
```diff
- pnpm build
+ pnpm generate
```

### 2. Backend (`src/main.ts` + `src/common/filters/spa-fallback.filter.ts`)
Создан `SpaFallbackFilter` - exception filter для обработки 404 ошибок:
```typescript
@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
  constructor(private readonly apiPrefix: string) {}

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const url = request.url;
    
    // Don't intercept API routes
    if (url.startsWith(`/${this.apiPrefix}`)) {
      reply.code(404).send({ statusCode: 404, message: 'Not Found' });
      return;
    }
    
    // Serve SPA fallback for all other routes
    reply.sendFile('200.html');
  }
}
```

Зарегистрирован в `main.ts`:
```typescript
app.useGlobalFilters(new SpaFallbackFilter(globalPrefix));
```

**Почему exception filter, а не `setNotFoundHandler`?**
- `@fastify/static` уже устанавливает свой `notFoundHandler`
- Попытка установить еще один вызывает ошибку "Not found handler already set"
- Exception filter работает на уровне NestJS и не конфликтует с Fastify плагинами


### 3. Nuxt Config (`ui/nuxt.config.ts`)
Добавлена поддержка baseURL для subpath deployment:
```typescript
app: {
  baseURL: process.env.NUXT_APP_BASE_URL || '/',
  // ...
}
```

## Результат

- ✅ `nuxt generate` создает полностью статический сайт с `index.html`, `200.html`, `404.html`
- ✅ `200.html` используется как SPA fallback для всех клиентских маршрутов
- ✅ API маршруты продолжают обрабатываться NestJS
- ✅ Поддержка deployment как в корне `/`, так и под subpath `/gran-p/`

## Деплой

### Для корня (текущая конфигурация)
```bash
git push origin main  # Запустит GitHub Actions
# На сервере:
docker-compose pull
docker-compose up -d
```

### Для subpath (опционально)
1. В GitHub: Settings → Actions → Variables → создать `NUXT_APP_BASE_URL=/gran-p/`
2. Запустить новый build
3. На сервере обновить образ

## Файлы изменены
- `.github/workflows/docker-image.yml` - команда сборки UI
- `src/main.ts` - SPA fallback handler
- `ui/nuxt.config.ts` - baseURL support
- `docs/DEPLOYMENT.md` - обновлена документация
- `docs/SUBPATH_DEPLOYMENT.md` - инструкция по деплою
- `ui/.env.production.example` - документация переменных
