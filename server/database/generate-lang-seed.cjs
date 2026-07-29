const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

// 1. Read extracted keys from code
const extractedKeys = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted-keys.json'), 'utf8'));

// 1b. Add keys found via labelKey that the regex missed
const ADDITIONAL_KEYS = [
  'assessmentReports', 'businessInfoTab', 'csrConfigTab',
  'dueToday', 'geoLocationTab', 'home', 'onTime',
  'processReports', 'registerDeviceTab', 'tagsTab', 'tasks',
  'remove',
];

// Manual Arabic translations for keys not covered by fallback or comprehensive SQL
const MANUAL_AR = {
  'alerts': 'التنبيهات',
  'arabicLanguage': 'العربية',
  'backToTasks': 'العودة إلى المهام',
  'businessInfoTab': 'معلومات العمل',
  'csrConfigTab': 'تكوين شهادة CSR',
  'english': 'الإنجليزية',
  'geoLocationTab': 'الموقع الجغرافي',
  'registerDeviceTab': 'تسجيل الجهاز',
  'tagsTab': 'العلامات',
  'unitedStates': 'الولايات المتحدة',
  'remove': 'إزالة',
};
for (const k of ADDITIONAL_KEYS) if (!extractedKeys.includes(k)) extractedKeys.push(k);
console.log('Extracted keys from code:', extractedKeys.length, '(+', ADDITIONAL_KEYS.length, 'via labelKey)');

// 2. Parse i18n.ts fallbackTranslations
const i18nSrc = fs.readFileSync(path.join(ROOT, 'client', 'src', 'i18n.ts'), 'utf8');
const enMatch = i18nSrc.match(/en:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*ar:\s*\{/);
const arMatch = i18nSrc.match(/ar:\s*\{([\s\S]*?)\n\s*\},\s*\n\};/);
function parseObj(body) {
  const map = {};
  const re = /(\w+)\s*:\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g;
  let m;
  while ((m = re.exec(body))) {
    const val = (m[2] !== undefined ? m[2] : m[3]).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    map[m[1]] = val;
  }
  return map;
}
const fallbackEn = enMatch ? parseObj(enMatch[1]) : {};
const fallbackAr = arMatch ? parseObj(arMatch[1]) : {};
console.log('Fallback en keys:', Object.keys(fallbackEn).length, 'ar keys:', Object.keys(fallbackAr).length);

// 3. Parse comprehensive-translations.sql
function parseSqlRows(sql) {
  const rows = {};
  const pattern = /\('([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)'\)/g;
  let match;
  while ((match = pattern.exec(sql))) {
    const key = match[1].replace(/''/g, "'");
    const en = match[2].replace(/''/g, "'");
    const ar = match[3].replace(/''/g, "'");
    rows[key] = { en, ar };
  }
  return rows;
}
const sqlPath = path.join(__dirname, 'comprehensive-translations.sql');
const sqlRows = fs.existsSync(sqlPath) ? parseSqlRows(fs.readFileSync(sqlPath, 'utf8')) : {};
console.log('Comprehensive SQL entries:', Object.keys(sqlRows).length);

// 4. Merge all sources for every extracted key
function camelToTitle(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

const entries = [];
const missingAr = [];

for (const key of extractedKeys) {
  let en = '';
  let ar = '';

  // Priority 1: i18n.ts fallback
  if (fallbackEn[key]) en = fallbackEn[key];
  if (fallbackAr[key]) ar = fallbackAr[key];

  // Priority 2: comprehensive SQL (if not already from fallback)
  if (!en && sqlRows[key]) en = sqlRows[key].en;
  if (!ar && sqlRows[key]) ar = sqlRows[key].ar;

  // Priority 3: auto-derive from key name
  if (!en) en = camelToTitle(key);
  if (!ar) {
    missingAr.push(key);
    ar = en;
  }

  // Priority 4: manual overrides
  if (MANUAL_AR[key]) ar = MANUAL_AR[key];

  entries.push({ key, en, ar });
}

// Sort by key
entries.sort((a, b) => a.key.localeCompare(b.key));

// 5. Generate SQL
function escapeSql(val) {
  return "'" + val.replace(/'/g, "''") + "'";
}

const sqlLines = entries.map(e => `(${escapeSql(e.key)}, ${escapeSql(e.en)}, ${escapeSql(e.ar)})`);

const sql = `-- Auto-generated complete language entries for hashibasha_language schema
-- Total keys: ${entries.length}
-- Sources: i18n.ts fallback, comprehensive-translations.sql, code extraction

CREATE SCHEMA IF NOT EXISTS hashibasha_language;

CREATE TABLE IF NOT EXISTS hashibasha_language.language_entries (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  en TEXT NOT NULL,
  ar TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hashibasha_language.language_entries (key, en, ar) VALUES
${sqlLines.join(',\n')}
ON CONFLICT (key) DO UPDATE SET
  en = EXCLUDED.en,
  ar = EXCLUDED.ar,
  updated_at = CURRENT_TIMESTAMP;
`;

const outPath = path.join(__dirname, 'complete-language-entries.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Written to:', path.relative(ROOT, outPath));
console.log('Total entries:', entries.length);
console.log('Keys with Arabic from fallback:', Object.keys(fallbackAr).filter(k => extractedKeys.includes(k)).length);
console.log('Keys with Arabic from SQL:', Object.keys(sqlRows).filter(k => extractedKeys.includes(k) && !fallbackAr[k]).length);
console.log('Keys with auto-derived Arabic (fallback EN):', missingAr.length);
