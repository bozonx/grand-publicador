# Database Configuration Changes

## Overview

The database configuration has been refactored to use `DATA_DIR` instead of `DATABASE_URL`. The database filename is now hardcoded as `grand-publicador.db`.

## Changes Made

### 1. Environment Variables

**Before:**
```bash
DATABASE_URL="file:/data/app.db"
```

**After:**
```bash
DATA_DIR="/data"
# Database filename is hardcoded as 'grand-publicador.db'
```

### 2. Configuration Files Updated

- `.env.development.example` - Changed to use `DATA_DIR="./test-data"`
- `.env.production.example` - Changed to use `DATA_DIR="/data"`
- `.env.development` - Updated for current development use
- `docker/docker-compose.yml` - Added `DATA_DIR=/data` environment variable

### 3. New Files Created

- `src/config/database.config.ts` - Utility functions to generate DATABASE_URL from DATA_DIR
- `prisma-wrapper.mjs` - Wrapper script for Prisma CLI commands

### 4. Code Updates

- `src/main.ts` - Automatically sets DATABASE_URL from DATA_DIR on startup
- `prisma/seed.ts` - Uses new database configuration logic
- `test/e2e/test-app.factory.ts` - Updated to use DATA_DIR

### 5. Documentation Updates

- `README.md` - Updated environment variables table and Prisma commands
- `docs/DEPLOYMENT.md` - Updated all references to database configuration

## Usage

### Running Prisma Commands

Use the `prisma-wrapper.mjs` script for all Prisma commands:

```bash
# Development migrations
node prisma-wrapper.mjs migrate dev --name migration_name

# Production migrations
node prisma-wrapper.mjs migrate deploy

# Seed database
node prisma-wrapper.mjs db seed

# Generate Prisma Client (no wrapper needed)
npx prisma generate
```

### Database Location

- **Development:** `./test-data/grand-publicador.db`
- **Production:** `/data/grand-publicador.db`

## Benefits

1. **Consistent Naming:** Database filename is always `grand-publicador.db`
2. **Simpler Configuration:** Only need to specify the data directory
3. **Easier Deployment:** No need to construct full database paths in environment files
4. **Better Organization:** Data directory can be easily changed without affecting the database filename

## Migration Guide

If you have an existing installation:

1. Update your `.env` file to use `DATA_DIR` instead of `DATABASE_URL`
2. Move your existing database file to the new location with the new name:
   ```bash
   # Development
   mv ./test-data/dev.db ./test-data/grand-publicador.db
   
   # Production (Docker)
   mv ./docker/data/app.db ./docker/data/grand-publicador.db
   ```
3. Restart the application

## Technical Details

The `getDatabaseUrl()` function in `src/config/database.config.ts`:
- Takes `DATA_DIR` from environment variables
- Resolves relative paths to absolute paths
- Appends the hardcoded filename `grand-publicador.db`
- Returns the complete DATABASE_URL in SQLite format (`file:...`)

This function is called:
- At application startup in `src/main.ts`
- In the seed script `prisma/seed.ts`
- By the `prisma-wrapper.mjs` for Prisma CLI commands
