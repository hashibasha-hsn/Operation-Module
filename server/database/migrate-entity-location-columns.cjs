'use strict';
/**
 * Migration: add country_id, state_id, location_city_id columns to the entities table.
 * Safe to re-run — uses ALTER TABLE ... IF NOT EXISTS.
 */
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.ORG_DB_NAME || 'hashibasha_org',
});

const COLUMNS = [
  { name: 'country_id',      type: 'VARCHAR(36)' },
  { name: 'state_id',        type: 'VARCHAR(36)' },
  { name: 'location_city_id', type: 'VARCHAR(36)' },
];

async function columnExists(client, table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return r.rowCount > 0;
}

client.connect().then(async () => {
  for (const col of COLUMNS) {
    const exists = await columnExists(client, 'entities', col.name);
    if (!exists) {
      await client.query(
        `ALTER TABLE entities ADD COLUMN "${col.name}" ${col.type}`,
      );
      console.log(`  Added column: entities.${col.name}`);
    } else {
      console.log(`  Already exists: entities.${col.name}`);
    }
  }
  console.log('Migration complete.');
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
