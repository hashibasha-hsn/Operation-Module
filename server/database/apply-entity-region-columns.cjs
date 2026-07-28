const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: process.env.DB_NAME || 'hashibasha_org',
};

async function main() {
  const client = new Client(config);
  await client.connect();

  const columns = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'entities'
    ORDER BY ordinal_position
  `);
  console.log('entities columns:', columns.rows.map((row) => row.column_name).join(', '));

  const sql = fs.readFileSync(path.join(__dirname, 'add-entity-region-columns.sql'), 'utf8');
  await client.query(sql);
  console.log('Applied add-entity-region-columns.sql');

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
