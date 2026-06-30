/**
 * Import Saudi National Address data from:
 * أحياء_مدن_السعودية_العنوان_الوطني.xlsx
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Client } = require('pg');

const EXCEL_FILE = path.join(__dirname, '..', '..', 'أحياء_مدن_السعودية_العنوان_الوطني.xlsx');
const IMPORT_USER = process.env.IMPORT_USER || 'excel-import';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: process.env.LOCATION_DB_NAME || 'hashibasha_location',
};

function clean(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .trim();
}

function makeCode(prefix, value, index) {
  const base = clean(value)
    .normalize('NFKD')
    .replace(/[^\w]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `${prefix}${base || 'X'}${index}`.slice(0, 10);
}

function parseRegionCell(cell) {
  const text = clean(cell);
  if (text.includes('/')) {
    const [nameAr, nameEn] = text.split('/').map((part) => clean(part));
    return { nameAr, nameEn: nameEn || nameAr };
  }
  return { nameAr: text, nameEn: text };
}

async function main() {
  if (!fs.existsSync(EXCEL_FILE)) {
    throw new Error(`Excel file not found: ${EXCEL_FILE}`);
  }

  const workbook = xlsx.readFile(EXCEL_FILE);
  const regionRows = xlsx.utils.sheet_to_json(workbook.Sheets['المناطق Regions'], { header: 1 }).slice(2);
  const cityRows = xlsx.utils.sheet_to_json(workbook.Sheets['فهرس المدن Cities'], { header: 1 }).slice(2);
  const districtRows = xlsx.utils.sheet_to_json(workbook.Sheets['الأحياء Districts'], { header: 1 }).slice(2);

  const client = new Client(dbConfig);
  await client.connect();

  await client.query('BEGIN');
  try {
    await client.query('TRUNCATE sa_districts, sa_cities, sa_region RESTART IDENTITY CASCADE');

    const regionIdByKey = new Map();
    let regionIndex = 0;

  for (const row of regionRows) {
    const nameAr = clean(row[0]);
    const nameEn = clean(row[1]);
    if (!nameAr) continue;
    if (/total|الإجمالي/i.test(`${nameAr} ${nameEn}`)) continue;

      const code = makeCode('R', nameEn || nameAr, regionIndex++);
      const result = await client.query(
        `INSERT INTO sa_region (name, name_ar, code, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING id`,
        [nameEn || nameAr, nameAr, code, IMPORT_USER],
      );
      regionIdByKey.set(nameAr, result.rows[0].id);
      regionIdByKey.set(nameEn, result.rows[0].id);
    }

    const cityIdByKey = new Map();
    let cityIndex = 0;

    for (const row of cityRows) {
      const region = parseRegionCell(row[0]);
      const nameAr = clean(row[1]);
      const nameEn = clean(row[2]);
      if (!nameAr) continue;

      const regionId =
        regionIdByKey.get(region.nameAr) ||
        regionIdByKey.get(region.nameEn) ||
        [...regionIdByKey.entries()].find(([key]) => key.includes(region.nameAr) || region.nameAr.includes(key))?.[1];

      if (!regionId) {
        console.warn('Skipping city without region:', nameAr, region);
        continue;
      }

      const code = makeCode('C', nameEn || nameAr, cityIndex++);
      const result = await client.query(
        `INSERT INTO sa_cities (region_id, name, name_ar, code, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (region_id, name_ar) DO UPDATE
           SET name = EXCLUDED.name, code = EXCLUDED.code, updated_by = EXCLUDED.updated_by
         RETURNING id`,
        [regionId, nameEn || nameAr, nameAr, code, IMPORT_USER],
      );
      const cityId = result.rows[0].id;
      cityIdByKey.set(`${regionId}::${nameAr}`, cityId);
      cityIdByKey.set(`${regionId}::${nameEn}`, cityId);
    }

    let districtIndex = 0;
    let insertedDistricts = 0;

    for (const row of districtRows) {
      const regionAr = clean(row[1]);
      const regionEn = clean(row[2]);
      const cityAr = clean(row[3]);
      const cityEn = clean(row[4]);
      const districtAr = clean(row[5]);
      const districtEn = clean(row[6]);
      if (!regionAr || !cityAr || !districtAr) continue;

      const regionId = regionIdByKey.get(regionAr) || regionIdByKey.get(regionEn);
      if (!regionId) continue;

      let cityId = cityIdByKey.get(`${regionId}::${cityAr}`) || cityIdByKey.get(`${regionId}::${cityEn}`);
      if (!cityId) {
        const code = makeCode('C', cityEn || cityAr, cityIndex++);
        const cityResult = await client.query(
          `INSERT INTO sa_cities (region_id, name, name_ar, code, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $5)
           ON CONFLICT (region_id, name_ar) DO UPDATE
             SET name = EXCLUDED.name, updated_by = EXCLUDED.updated_by
           RETURNING id`,
          [regionId, cityEn || cityAr, cityAr, code, IMPORT_USER],
        );
        cityId = cityResult.rows[0].id;
        cityIdByKey.set(`${regionId}::${cityAr}`, cityId);
      }

      const code = makeCode('D', districtEn || districtAr, districtIndex++);
      await client.query(
        `INSERT INTO sa_districts (city_id, name, name_ar, code, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (city_id, name_ar) DO UPDATE
           SET name = EXCLUDED.name, code = EXCLUDED.code, updated_by = EXCLUDED.updated_by`,
        [cityId, districtEn || districtAr, districtAr, code, IMPORT_USER],
      );
      insertedDistricts += 1;
    }

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM sa_region) AS regions,
        (SELECT COUNT(*) FROM sa_cities) AS cities,
        (SELECT COUNT(*) FROM sa_districts) AS districts
    `);

    console.log('Import complete:', counts.rows[0]);
    console.log('District rows processed:', insertedDistricts);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
