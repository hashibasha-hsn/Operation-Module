'use strict';
/**
 * Adds UNIQUE constraints to states and cities tables
 * (needed for ON CONFLICT upserts in the import script).
 */
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.LOCATION_DB_NAME || 'hashibasha_location',
});

async function addConstraintIfMissing(client, table, constraintName, definition) {
  const r = await client.query(
    'SELECT 1 FROM pg_constraint WHERE conname = $1',
    [constraintName]
  );
  if (r.rowCount === 0) {
    await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} ${definition}`);
    console.log(`  Added: ${constraintName}`);
  } else {
    console.log(`  Already exists: ${constraintName}`);
  }
}

client.connect().then(async () => {
  await addConstraintIfMissing(
    client, 'states', 'uq_states_country_name',
    'UNIQUE (country_id, name)'
  );
  await addConstraintIfMissing(
    client, 'cities', 'uq_cities_state_name',
    'UNIQUE (state_id, name)'
  );
  await addConstraintIfMissing(
    client, 'countries', 'uq_countries_code',
    'UNIQUE (code)'
  );
  console.log('Done.');
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
