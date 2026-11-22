import { neon } from '@neondatabase/serverless';

function databaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

const url = databaseUrl();
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(url);
