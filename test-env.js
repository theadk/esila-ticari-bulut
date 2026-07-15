import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ override: true });
console.log('DATABASE_URL:', process.env.DATABASE_URL);
