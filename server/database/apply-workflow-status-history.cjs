const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'hashibasha_org',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const sql = fs.readFileSync(path.join(__dirname, 'add-workflow-status-history.sql'), 'utf8');

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO hashibasha_org`);
    await client.query(sql);
    console.log('Workflow status-history + parent columns added.');
    const res = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'hashibasha_org'
        AND table_name IN ('processes', 'audits')
        AND column_name IN ('status_history', 'parent_id')
      ORDER BY table_name, column_name
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
