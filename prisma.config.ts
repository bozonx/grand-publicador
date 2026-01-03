import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './src/config/database.config.js';

/**
 * Prisma configuration for v7.
 * Database URL is automatically constructed from DATA_DIR environment variable.
 * DATA_DIR is REQUIRED - application will fail if not set.
 */
export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),
  datasource: {
    // getDatabaseUrl() will throw if DATA_DIR is not set
    url: getDatabaseUrl(),
  },
  migrations: {
    // Seed command for Prisma 7 (using --import for Node.js v20.6+)
    seed: 'node --import tsx prisma/seed.ts',
  },
});
