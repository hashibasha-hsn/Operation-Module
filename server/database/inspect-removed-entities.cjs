const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Rasika',
    database: 'hashibasha_org',
  });
  await client.connect();
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'removed_entities'
    ORDER BY ordinal_position
  `);
  console.log(result.rows.map((row) => row.column_name).join(', '));
  await client.end();
}

main().catch(console.error);
