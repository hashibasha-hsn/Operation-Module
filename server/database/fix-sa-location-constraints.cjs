'use strict';
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.LOCATION_DB_NAME || 'hashibasha_location',
});

async function addConstraintIfMissing(name, table, definition) {
  const r = await client.query(
    'SELECT 1 FROM pg_constraint WHERE conname = $1', [name]
  );
  if (r.rowCount === 0) {
    await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}`);
    console.log(`  Added: ${name}`);
  } else {
    console.log(`  Already exists: ${name}`);
  }
}

client.connect().then(async () => {
  // countries/states/cities constraints
  await addConstraintIfMissing('uq_countries_code',     'countries',     'UNIQUE (code)');
  await addConstraintIfMissing('uq_states_country_name','states',        'UNIQUE (country_id, name)');
  await addConstraintIfMissing('uq_cities_state_name',  'cities',        'UNIQUE (state_id, name)');
  // sa_cities and sa_districts constraints
  await addConstraintIfMissing('sa_cities_region_id_name_ar_key', 'sa_cities',    'UNIQUE (region_id, name_ar)');
  await addConstraintIfMissing('sa_districts_city_id_name_ar_key','sa_districts', 'UNIQUE (city_id, name_ar)');
  console.log('Done.');
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
