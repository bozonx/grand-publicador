# Deployment Guide

## Quick Deploy with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd grand-publicador
```

2. **Configure environment variables**

Edit `docker/docker-compose.yml` and set:
- `JWT_SECRET` - Generate a strong random secret (min 32 characters)
- `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
- `API_KEY` - Generate a strong random key for External/Automation API

```bash
# Generate secrets (Linux/macOS):
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For API_KEY
```

3. **Create data directory**
```bash
mkdir -p docker/data
```

4. **Pull and run**
```bash
cd docker
docker-compose pull
docker-compose up -d
```

The application will be available at `http://localhost:8080`

### Health Check
```bash
curl http://localhost:8080/api/v1/health
```

### View Logs
```bash
docker-compose logs -f
```

### Stop
```bash
docker-compose down
```

## Architecture

- **Single Container**: Backend (NestJS + Fastify) and Frontend (Nuxt SPA) in one container
- **Static Serving**: Fastify serves the Nuxt static build from `ui/.output/public`
- **Database**: SQLite stored in `/data/app.db` (mounted volume)
- **Port**: 8080 (both API and UI)

## Environment Variables

### Backend Runtime (docker-compose.yml or .env.production)
These variables are used by the backend when running:
- `NODE_ENV=production` - Environment mode
- `LISTEN_HOST=0.0.0.0` - Host to bind
- `LISTEN_PORT=8080` - Port to listen on
- `LOG_LEVEL=warn` - Logging level
- `DATABASE_URL=file:/data/app.db` - SQLite database path
- `JWT_SECRET` - Secret for JWT tokens (REQUIRED)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (REQUIRED)
- `API_KEY` - API key for External/Automation API (REQUIRED)

### Frontend Build-time (ui/.env.production or CI/CD)
These variables are embedded into the static bundle during `pnpm build`:
- `VITE_DEV_MODE=false` - Disable dev features
- `NUXT_PUBLIC_API_BASE=""` - Empty = use same host as frontend

**Note**: Frontend variables are NOT needed at runtime. They are only used during the build process and become part of the static JavaScript files.

**App Name**: The application name is defined in i18n locales (`ui/i18n/locales/*.json` under `common.appName`) and can be different for each language.

### Development Override (ui/.env)
- `VITE_DEV_MODE=true` - Enable dev features
- `VITE_DEV_TELEGRAM_ID=<your-id>` - Auto-login in dev
- `NUXT_PUBLIC_API_BASE=http://localhost:8080` - Separate backend URL


## API Endpoints

All endpoints are served from the same host:

- **Frontend**: `http://localhost:8080/`
- **API**: `http://localhost:8080/api/v1/...`
- **Health**: `http://localhost:8080/api/v1/health`

### Authentication
- `POST /api/v1/auth/telegram` - Login with Telegram initData
- `GET /api/v1/auth/me` - Get current user (requires JWT)

### External API (requires API_KEY header)
- `POST /api/external/v1/publications` - Create publication
- See [docs/api-external.md](../docs/api-external.md)

## Reverse Proxy Setup (Optional)

If deploying behind nginx/traefik:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup

Backup the data directory:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz docker/data/
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs
```

### Database issues
```bash
# Reset database (WARNING: deletes all data)
rm docker/data/app.db
docker-compose restart
```

### Check container health
```bash
docker ps
# Look for "healthy" status
```
