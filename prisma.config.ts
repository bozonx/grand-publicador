import { config } from 'dotenv';
import path from 'path';

// Load environment-specific file first, then fallback to .env
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
config(); // Load default .env as fallback

export default {
    datasource: {
        url: process.env.DATABASE_URL,
    },
};
