/**
 * Upsert all EN/AR translations into hashibasha_language.language_entries.
 * Sources: SQL seed files + client/src/i18n.ts fallbacks + hardcoded gaps.
 *
 * Usage: node server/database/sync-all-translations.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..', '..');

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function parseSqlRows(sql) {
  const rows = new Map();
  const pattern =
    /\('([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)'\)/g;
  let match = pattern.exec(sql);
  while (match) {
    const key = match[1].replace(/''/g, "'");
    const en = match[2].replace(/''/g, "'");
    const ar = match[3].replace(/''/g, "'");
    rows.set(key, { key, en, ar });
    match = pattern.exec(sql);
  }
  return rows;
}

/** Parse fallbackTranslations en/ar blocks from i18n.ts */
function parseI18nFallbacks(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const enBlock = src.match(/en:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*ar:\s*\{/);
  const arBlock = src.match(/ar:\s*\{([\s\S]*?)\n\s*\},\s*\n\};/);
  if (!enBlock || !arBlock) {
    throw new Error('Could not parse fallbackTranslations from i18n.ts');
  }

  function parseObjectLiteral(body) {
    const map = {};
    const re = /(\w+)\s*:\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g;
    let m;
    while ((m = re.exec(body))) {
      const val = (m[2] !== undefined ? m[2] : m[3])
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      map[m[1]] = val;
    }
    return map;
  }

  const en = parseObjectLiteral(enBlock[1]);
  const ar = parseObjectLiteral(arBlock[1]);
  const rows = new Map();
  for (const key of Object.keys(en)) {
    rows.set(key, { key, en: en[key], ar: ar[key] || en[key] });
  }
  return rows;
}

const EXTRA_GAPS = [
  { key: 'audit', en: 'Audit', ar: 'تدقيق' },
  { key: 'categories', en: 'Categories', ar: 'الفئات' },
  { key: 'categoryNameIsRequired', en: 'Category name is required', ar: 'اسم الفئة مطلوب' },
  { key: 'courseNameIsRequired', en: 'Course name is required', ar: 'اسم الدورة مطلوب' },
  { key: 'createAsset', en: 'Create Asset', ar: 'إنشاء أصل' },
  { key: 'enableDiscussions', en: 'Enable Discussions', ar: 'تفعيل المناقشات' },
  { key: 'image', en: 'Image', ar: 'صورة' },
  { key: 'noRemovedUsers', en: 'No removed users', ar: 'لا يوجد مستخدمون محذوفون' },
  { key: 'passing', en: 'Passing', ar: 'ناجح' },
  { key: 'pleaseSelectACategory', en: 'Please select a category', ar: 'يرجى اختيار فئة' },
  { key: 'process', en: 'Process', ar: 'عملية' },
  { key: 'profileName', en: 'Profile Name', ar: 'اسم الملف الشخصي' },
  {
    key: 'selectFieldsToDisplayInTheUserTable',
    en: 'Select fields to display in the user table',
    ar: 'حدد الحقول لعرضها في جدول المستخدمين',
  },
  {
    key: 'selectUserTagColumnsToDisplay',
    en: 'Select user tag columns to display',
    ar: 'حدد أعمدة وسوم المستخدم للعرض',
  },
  { key: 'to', en: 'to', ar: 'إلى' },
  {
    key: 'updateDropdownTagWithMultipleValues',
    en: 'Update dropdown tag with multiple values',
    ar: 'تحديث وسم القائمة المنسدلة بقيم متعددة',
  },
  { key: 'upload', en: 'Upload', ar: 'رفع' },
  { key: 'video', en: 'Video', ar: 'فيديو' },
];

async function ensureTable(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS hashibasha_language`);
  await client.query(`SET search_path TO hashibasha_language, public`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS language_entries (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      en TEXT NOT NULL,
      ar TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // audit columns if missing
  await client.query(`ALTER TABLE language_entries ADD COLUMN IF NOT EXISTS created_by varchar(255)`);
  await client.query(`ALTER TABLE language_entries ADD COLUMN IF NOT EXISTS updated_by varchar(255)`);
}

async function upsertRows(client, rows) {
  let n = 0;
  for (const row of rows) {
    if (!row.key || !row.en) continue;
    const ar = row.ar && String(row.ar).trim() ? row.ar : row.en;
    await client.query(
      `INSERT INTO language_entries (key, en, ar)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE
         SET en = EXCLUDED.en,
             ar = EXCLUDED.ar,
             updated_at = CURRENT_TIMESTAMP`,
      [row.key, row.en, ar],
    );
    n += 1;
  }
  return n;
}

async function main() {
  const env = {
    ...loadEnvFile(path.join(ROOT, '.env')),
    ...loadEnvFile(path.join(ROOT, 'server', 'org-service', '.env')),
  };

  const client = new Client({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT || '5432', 10),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'postgres',
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    family: 4,
  });

  await client.connect();
  await ensureTable(client);

  const merged = new Map();

  for (const file of [
    'comprehensive-translations.sql',
    'sample-translations.sql',
    'missing-translations.sql',
  ]) {
    const sqlPath = path.join(__dirname, file);
    if (!fs.existsSync(sqlPath)) continue;
    const rows = parseSqlRows(fs.readFileSync(sqlPath, 'utf8'));
    for (const [k, v] of rows) merged.set(k, v);
    console.log(`Parsed ${rows.size} keys from ${file}`);
  }

  const i18nPath = path.join(ROOT, 'client', 'src', 'i18n.ts');
  const i18nRows = parseI18nFallbacks(i18nPath);
  for (const [k, v] of i18nRows) merged.set(k, v);
  console.log(`Parsed ${i18nRows.size} keys from i18n.ts`);

  for (const row of EXTRA_GAPS) merged.set(row.key, row);

  const upserted = await upsertRows(client, merged.values());
  console.log(`Upserted ${upserted} entries`);

  const stats = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE ar IS NULL OR btrim(ar) = '')::int AS empty_ar,
      COUNT(*) FILTER (WHERE ar = en AND en ~ '[A-Za-z]')::int AS same_as_en
    FROM language_entries
  `);
  console.log('DB stats:', stats.rows[0]);

  await client.end();

  for (const url of [
    'http://localhost:3012/cache/clear',
    'http://localhost:3009/api/language/cache/clear',
  ]) {
    try {
      const res = await fetch(url, { method: 'POST' });
      console.log(`Cache clear ${url}: ${res.status}`);
    } catch (err) {
      console.log(`Cache clear skipped (${url}): ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
