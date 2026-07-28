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

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const clientSrc = path.join(__dirname, '../../client/src');
  const used = new Set();
  for (const file of walk(clientSrc)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\(\s*['"]([a-zA-Z][a-zA-Z0-9_]*)['"]/g)) {
      used.add(m[1]);
    }
  }

  const env = loadEnv(path.join(__dirname, '../org-service/.env'));
  const client = new Client({
    host: env.DB_HOST,
    port: +env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    family: 4,
  });
  await client.connect();
  await client.query("SET client_encoding TO 'UTF8'");
  const { rows } = await client.query(
    'SELECT key, en, ar FROM hashibasha_language.language_entries',
  );
  const db = new Map(rows.map((r) => [r.key, r]));

  const missing = [...used].filter((k) => !db.has(k)).sort();
  const emptyAr = rows.filter((r) => !r.ar || !String(r.ar).trim());
  const sameAsEn = rows.filter(
    (r) => r.ar === r.en && /[A-Za-z]/.test(r.en || '') && !['english', 'unitedStates', 'emailPlaceholder', 'passwordPlaceholder'].includes(r.key),
  );

  console.log(`UI t() keys: ${used.size}`);
  console.log(`DB entries: ${rows.length}`);
  console.log(`Missing from DB: ${missing.length}`);
  console.log(`Empty ar: ${emptyAr.length}`);
  console.log(`Same as EN (non-placeholder): ${sameAsEn.length}`);
  if (missing.length) {
    console.log('Missing keys:');
    missing.forEach((k) => console.log(' -', k));
  }
  if (sameAsEn.length && sameAsEn.length <= 40) {
    console.log('Same-as-EN keys:');
    sameAsEn.forEach((r) => console.log(' -', r.key, '=', r.en));
  }

  // Verify locale API
  const enRes = await fetch('http://localhost:3009/api/language/locale/en');
  const arRes = await fetch('http://localhost:3009/api/language/locale/ar');
  const enMap = await enRes.json();
  const arMap = await arRes.json();
  console.log(`API locale en=${Object.keys(enMap).length} ar=${Object.keys(arMap).length}`);
  console.log('sample ar.login =', arMap.login);
  console.log('sample ar.dashboard =', arMap.dashboard);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
