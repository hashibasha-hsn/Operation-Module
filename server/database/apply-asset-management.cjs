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

const sql = fs.readFileSync(path.join(__dirname, 'add-asset-management.sql'), 'utf8');

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO hashibasha_org`);
    await client.query(sql);
    console.log('Asset management columns added.');
    const res = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'hashibasha_org'
        AND table_name IN ('asset_tables', 'assets', 'asset_filters')
        AND column_name IN ('publish_status', 'renewal_reminder_config', 'view_roles', 'edit_roles',
                            'lock_table_operations', 'is_deleted', 'deleted_at', 'table_id',
                            'owner_user_id', 'photo_urls', 'file_urls', 'ticket_ids',
                            'previous_owners', 'name', 'criteria', 'visibility', 'created_by')
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
