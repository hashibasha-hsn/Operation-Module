/**
 * Add display_order to noticeboard_posts for arrange boards.
 * Run: node server/database/migrate-noticeboard-display-order.cjs
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
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
  `);
  await client.query(`
    UPDATE noticeboard_posts
    SET display_order = sub.row_num
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at ASC) AS row_num
      FROM noticeboard_posts
    ) sub
    WHERE noticeboard_posts.id = sub.id AND noticeboard_posts.display_order = 0;
  `);
  await client.end();
  console.log('noticeboard display_order migration OK');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
