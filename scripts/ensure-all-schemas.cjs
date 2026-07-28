const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../server/user-service/node_modules/pg'));

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(__dirname, '../server/user-service/.env'));

async function main() {
  const schemas = [
    'hashibasha_auth',
    'hashibasha_user',
    'hashibasha_org',
    'hashibasha_notification',
    'hashibasha_permission',
    'hashibasha_location',
    'hashibasha_language',
  ];
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  for (const schema of schemas) {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    console.log('ok', schema);
  }
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
