const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: process.env.LANGUAGE_DB_NAME || 'hashibasha_language',
};

function parseTranslationRows(sql) {
  const rows = new Map();
  const pattern = /\('([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)'\)/g;
  let match = pattern.exec(sql);
  while (match) {
    const key = match[1].replace(/''/g, "'");
    const en = match[2].replace(/''/g, "'");
    const ar = match[3].replace(/''/g, "'");
    rows.set(key, { key, en, ar });
    match = pattern.exec(sql);
  }
  return Array.from(rows.values());
}

async function upsertRows(client, rows) {
  let count = 0;
  for (const row of rows) {
    await client.query(
      `INSERT INTO language_entries (key, en, ar)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET en = EXCLUDED.en, ar = EXCLUDED.ar`,
      [row.key, row.en, row.ar],
    );
    count += 1;
  }
  return count;
}

async function importFromOrg(client) {
  const orgClient = new Client({ ...config, database: 'hashibasha_org' });
  try {
    await orgClient.connect();
    const { rows } = await orgClient.query('SELECT key, en, ar FROM translations ORDER BY key');
    return rows.length ? upsertRows(client, rows) : 0;
  } catch {
    return 0;
  } finally {
    await orgClient.end().catch(() => undefined);
  }
}

async function importFromSqlFiles(client) {
  const files = [
    'comprehensive-translations.sql',
    'sample-translations.sql',
    'missing-translations.sql',
  ];
  let total = 0;

  for (const file of files) {
    const sqlPath = path.join(__dirname, file);
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const rows = parseTranslationRows(sql);
    if (rows.length) {
      total += await upsertRows(client, rows);
      console.log(`Imported ${rows.length} unique keys from ${file}`);
    }
  }

  return total;
}

async function main() {
  const client = new Client(config);
  await client.connect();

  const fromOrg = await importFromOrg(client);
  if (fromOrg > 0) {
    console.log(`Imported ${fromOrg} entries from hashibasha_org.translations`);
  } else {
    await importFromSqlFiles(client);
  }

  const total = await client.query('SELECT COUNT(*)::int AS count FROM language_entries');
  console.log(`Total language entries: ${total.rows[0].count}`);
  await client.end();

  try {
    const port = process.env.LANGUAGE_SERVICE_PORT || '3014';
    await fetch(`http://localhost:${port}/cache/clear`, { method: 'POST' });
    console.log('Language service cache cleared');
  } catch {
    console.log('Language service not running — restart it to load new translations');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
