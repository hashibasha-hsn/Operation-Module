import { Client } from 'pg';

export async function ensurePostgresSchema(options: {
  schema: string;
  databaseUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}): Promise<void> {
  const ssl = options.ssl ? { rejectUnauthorized: false } : undefined;
  const client = options.databaseUrl
    ? new Client({ connectionString: options.databaseUrl, ssl })
    : new Client({
        host: options.host || 'localhost',
        port: options.port || 5432,
        user: options.user || 'postgres',
        password: options.password,
        database: options.database || 'postgres',
        ssl,
      });

  try {
    await client.connect();
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${options.schema}"`);
  } finally {
    await client.end().catch(() => undefined);
  }
}