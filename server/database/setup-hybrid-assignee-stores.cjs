const pg = require('pg');

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: process.env.DB_NAME || 'hashibasha_user',
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS hybrid_assignee_stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organizationid VARCHAR NOT NULL,
        storeid VARCHAR NOT NULL,
        createdat TIMESTAMP DEFAULT NOW(),
        UNIQUE (organizationid, storeid)
      )
    `);
    console.log('hybrid_assignee_stores table is ready.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
