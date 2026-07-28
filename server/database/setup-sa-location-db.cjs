const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
};

const dbName = process.env.LOCATION_DB_NAME || 'hashibasha_location';

async function main() {
  const admin = new Client({ ...config, database: 'postgres' });
  await admin.connect();

  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }
  await admin.end();

  const sql = fs.readFileSync(path.join(__dirname, 'sa-location-schema.sql'), 'utf8');
  const client = new Client({ ...config, database: dbName });
  await client.connect();
  await client.query(sql);
  console.log('Applied sa-location-schema.sql');
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
