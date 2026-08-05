const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const sql = fs.readFileSync(path.join(__dirname, 'designation-schema.sql'), 'utf8');

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO hashibasha_user`);
    await client.query(sql);
    const res = await client.query(`
      SELECT name, category FROM features
      WHERE category = 'asset' OR name = 'learning_view'
      ORDER BY name
    `);
    console.log('Features now seeded:');
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
