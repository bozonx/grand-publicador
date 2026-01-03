#!/bin/sh
set -e

# Set DATABASE_URL for Prisma
export DATABASE_URL="file:${DATA_DIR}/grand-publicador.db"

echo "📊 Database URL: $DATABASE_URL"

# Ensure data directory exists
mkdir -p "${DATA_DIR}"

# Run database migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed! Check the logs above."
    exit 1
fi

# Start the application
echo "🚀 Starting application..."
exec "$@"
