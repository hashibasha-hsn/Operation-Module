const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../org-service/node_modules/pg'));

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'add-audit-columns-migration.sql'), 'utf8');
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('connected');
  await client.query(sql);
  const missing = await client.query(`
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema LIKE 'hashibasha_%'
      AND t.table_type = 'BASE TABLE'
      AND (
        NOT EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema=t.table_schema AND c.table_name=t.table_name AND c.column_name='created_by'
        )
        OR NOT EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema=t.table_schema AND c.table_name=t.table_name AND c.column_name='updated_by'
        )
      )
    ORDER BY 1,2
  `);
  console.log('tables missing created_by/updated_by:', missing.rows.length);
  missing.rows.forEach(r => console.log(r.table_schema + '.' + r.table_name));
  await client.end();
}
main().catch(e => { console.error(e); process.exit(1); });
