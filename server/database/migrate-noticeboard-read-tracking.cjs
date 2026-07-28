/**
 * Add schedule, targeting, and read-tracking columns/tables for noticeboard.
 * Run: node server/database/migrate-noticeboard-read-tracking.cjs
 */
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'Rasika',
    database: process.env.PGDATABASE || 'hashibasha_org',
  });

  await client.connect();

  await client.query(`
    ALTER TABLE noticeboard_posts
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS target_store_ids JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS target_user_ids JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS noticeboard_reads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES noticeboard_posts(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_noticeboard_reads_post_id ON noticeboard_reads(post_id);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_noticeboard_reads_user_id ON noticeboard_reads(user_id);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_noticeboard_posts_start_date ON noticeboard_posts(start_date);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_noticeboard_posts_end_date ON noticeboard_posts(end_date);
  `);

  await client.end();
  console.log('noticeboard read-tracking migration OK');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
