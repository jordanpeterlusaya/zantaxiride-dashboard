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

let client;

export function sql(strings, ...values) {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client(strings, ...values);
}
