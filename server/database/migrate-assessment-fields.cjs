const pg = require('pg');

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: process.env.DB_NAME || 'hashibasha_org',
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assigneeids JSONB DEFAULT '[]';
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS storeids JSONB DEFAULT '[]';
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS properties JSONB;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS certificatesettings JSONB;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS startdate TIMESTAMP;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS showresult BOOLEAN DEFAULT false;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS showcorrectanswer BOOLEAN DEFAULT false;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS dynamicassignment BOOLEAN DEFAULT false;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS generatecertificate BOOLEAN DEFAULT false;
    `);
    console.log('Assessment columns migration completed.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
