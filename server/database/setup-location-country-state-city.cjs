/**
 * Creates (if needed) the hashibasha_location database and applies
 * the countries / states / cities schema.
 *
 * Usage:
 *   node server/database/setup-location-country-state-city.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
};

const dbName = process.env.LOCATION_DB_NAME || 'hashibasha_location';

async function main() {
  // Ensure the database exists
  const admin = new Client({ ...pgConfig, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }
  await admin.end();

  // Apply schema
  const schemaPath = path.join(__dirname, 'location-country-state-city-schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = new Client({ ...pgConfig, database: dbName });
  await client.connect();
  await client.query(sql);
  console.log('Applied location-country-state-city-schema.sql');

  // Ensure unique constraints exist (tables may have been pre-created by TypeORM without them)
  async function addConstraintIfMissing(name, table, definition) {
    const r = await client.query('SELECT 1 FROM pg_constraint WHERE conname = $1', [name]);
    if (r.rowCount === 0) {
      await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}`);
      console.log(`  Added constraint: ${name}`);
    }
  }
  await addConstraintIfMissing('uq_countries_code',      'countries', 'UNIQUE (code)');
  await addConstraintIfMissing('uq_states_country_name', 'states',    'UNIQUE (country_id, name)');
  await addConstraintIfMissing('uq_cities_state_name',   'cities',    'UNIQUE (state_id, name)');
  // SA-specific tables (may exist from prior TypeORM sync)
  await addConstraintIfMissing('sa_cities_region_id_name_ar_key',  'sa_cities',    'UNIQUE (region_id, name_ar)');
  await addConstraintIfMissing('sa_districts_city_id_name_ar_key', 'sa_districts', 'UNIQUE (city_id, name_ar)');

  await client.end();

  console.log('Done. Run "npm run import:location-country-data" to seed SA data from the Excel file.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
