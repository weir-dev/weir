import postgres from 'postgres';

let sql: any = null;

export function getDb() {
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!rawUrl) return null;

  if (!sql) {
    let cleanUrl = rawUrl
      .replace('postgresql+asyncpg://', 'postgresql://')
      .replace('postgresql+psycopg2://', 'postgresql://');

    try {
      sql = postgres(cleanUrl, {
        ssl: 'require',
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false, // Required for Supabase Transaction Pooler (PgBouncer/Supavisor)
      });
    } catch (e) {
      console.error('[DB] Failed to initialize Postgres connection:', e);
      return null;
    }
  }

  return sql;
}
