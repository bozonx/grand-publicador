#!/bin/sh
set -e

# Run database migrations
# Run database migrations
echo "Running database migrations..."
export DATABASE_URL="file:${DATA_DIR}/grand-publicador.db"
npx prisma migrate deploy

# Start the application
echo "Starting application..."
exec "$@"
