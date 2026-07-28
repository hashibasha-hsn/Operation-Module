const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(filePath) {
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, i)] = v;
  }
  return env;
}

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'missing-translations.sql'), 'utf8');
  const m = sql.match(/'login',\s*'[^']*',\s*'([^']+)'/);
  console.log('sql login ar:', m && m[1]);

  const i18n = fs.readFileSync(path.join(__dirname, '../../client/src/i18n.ts'), 'utf8');
  const arPart = i18n.split(/\nar:\s*\{/)[1] || '';
  const m2 = arPart.match(/login:\s*"([^"]+)"/);
  console.log('i18n login ar:', m2 && m2[1]);

  const env = loadEnv(path.join(__dirname, '../org-service/.env'));
  const client = new Client({
    host: env.DB_HOST,
    port: +env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query("SET client_encoding TO 'UTF8'");
  const r = await client.query(
    `SELECT key, ar, octet_length(ar) AS bytes, length(ar) AS chars
     FROM hashibasha_language.language_entries
     WHERE key IN ('login','noticeBoard','dashboard','save')`,
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
