import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Rasika',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'hashibasha_org',
});

const client = await pool.connect();
try {
  await client.query(`ALTER TABLE audits ADD COLUMN IF NOT EXISTS "processTags" json`);
  await client.query(`ALTER TABLE audits ADD COLUMN IF NOT EXISTS properties json`);
  console.log('Audit properties migration completed.');
} finally {
  client.release();
  await pool.end();
}
