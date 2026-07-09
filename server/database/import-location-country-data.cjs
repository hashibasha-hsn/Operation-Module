/**
 * Seed countries / states / cities from the Saudi National Address Excel:
 *   أحياء_مدن_السعودية_العنوان_الوطني (1).xlsx
 *
 * Mapping:
 *   countries  ← Saudi Arabia (one row, code "SA")
 *   states     ← sheet "المناطق Regions"  (13 regions)
 *   cities     ← sheet "فهرس المدن Cities" (152 cities)
 *
 * The districts sheet is already handled by the sa_districts table.
 *
 * Usage:
 *   node server/database/import-location-country-data.cjs
 *
 * Re-run safe: uses INSERT … ON CONFLICT DO UPDATE so it is idempotent.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Support both xlsx and openpyxl-style; use the xlsx npm package
let xlsx;
try {
  xlsx = require('xlsx');
} catch {
  console.error(
    'Missing "xlsx" package. Install it with: npm install xlsx  (in the project root)',
  );
  process.exit(1);
}

const { getPgClient, findSaLocationExcel, useLocationSchema } = require('./location-import-config.cjs');

const EXCEL_FILE = findSaLocationExcel();

const IMPORT_USER = process.env.IMPORT_USER || 'excel-import';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clean(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .trim();
}

/**
 * Parse a bilingual region cell like "منطقة الرياض / Riyadh"
 */
function parseRegionCell(cell) {
  const text = clean(cell);
  if (text.includes('/')) {
    const parts = text.split('/').map((p) => clean(p));
    return { nameAr: parts[0], nameEn: parts[1] || parts[0] };
  }
  return { nameAr: text, nameEn: text };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!EXCEL_FILE) {
    throw new Error(
      'Excel file not found in project root (أحياء_مدن_السعودية_العنوان_الوطني.xlsx)',
    );
  }
  console.log('Reading Excel:', EXCEL_FILE);

  const workbook = xlsx.readFile(EXCEL_FILE);

  // Sheet: المناطق Regions  — skip first 2 header rows
  const regionRows = xlsx.utils
    .sheet_to_json(workbook.Sheets['المناطق Regions'], { header: 1 })
    .slice(2);

  // Sheet: فهرس المدن Cities — skip first 2 header rows
  const cityRows = xlsx.utils
    .sheet_to_json(workbook.Sheets['فهرس المدن Cities'], { header: 1 })
    .slice(2);

  const client = getPgClient();
  await client.connect();
  await useLocationSchema(client);

  await client.query('BEGIN');
  try {
    // ── 1. Upsert Saudi Arabia as the country ──────────────────────────────
    const countryResult = await client.query(
      `INSERT INTO countries (name, name_ar, code, code3, phone_code, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, true, $6, $6)
       ON CONFLICT (code) DO UPDATE
         SET name       = EXCLUDED.name,
             name_ar    = EXCLUDED.name_ar,
             code3      = EXCLUDED.code3,
             phone_code = EXCLUDED.phone_code,
             updated_by = EXCLUDED.updated_by
       RETURNING id`,
      ['Saudi Arabia', 'المملكة العربية السعودية', 'SA', 'SAU', '+966', IMPORT_USER],
    );
    const countryId = countryResult.rows[0].id;
    console.log(`Country "Saudi Arabia" → id: ${countryId}`);

    await client.query('DELETE FROM cities WHERE state_id IN (SELECT id FROM states WHERE country_id = $1)', [countryId]);
    await client.query('DELETE FROM states WHERE country_id = $1', [countryId]);

    // ── 2. Insert States (Regions) ─────────────────────────────────────────
    const stateIdByKey = new Map(); // nameAr → id  &  nameEn → id
    let stateCount = 0;

    for (const row of regionRows) {
      const nameAr = clean(row[0]);
      const nameEn = clean(row[1]);
      if (!nameAr) continue;
      // Skip the totals row
      if (/total|الإجمالي/i.test(`${nameAr} ${nameEn}`)) continue;

      const result = await client.query(
        `INSERT INTO states (country_id, name, name_ar, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, true, $4, $4)
         RETURNING id`,
        [countryId, nameEn || nameAr, nameAr, IMPORT_USER],
      );

      const stateId = result.rows[0].id;
      stateIdByKey.set(nameAr, stateId);
      if (nameEn) stateIdByKey.set(nameEn, stateId);
      stateCount++;
    }
    console.log(`Inserted ${stateCount} states.`);

    // Helper: find state id, tolerating partial name matches
    function resolveStateId(nameAr, nameEn) {
      if (stateIdByKey.has(nameAr)) return stateIdByKey.get(nameAr);
      if (nameEn && stateIdByKey.has(nameEn)) return stateIdByKey.get(nameEn);
      // Fuzzy: check if any stored key contains or is contained in nameAr
      for (const [key, id] of stateIdByKey) {
        if (nameAr && (key.includes(nameAr) || nameAr.includes(key))) return id;
      }
      return null;
    }

    // ── 3. Insert Cities ───────────────────────────────────────────────────
    const cityBatch = [];
    let skipped = 0;

    for (const row of cityRows) {
      const regionCell = row[0];
      if (!regionCell) continue;

      const region = parseRegionCell(regionCell);
      const cityAr = clean(row[1]);
      const cityEn = clean(row[2]);
      if (!cityAr) continue;

      const stateId = resolveStateId(region.nameAr, region.nameEn);
      if (!stateId) {
        console.warn(`  Skipping city "${cityAr}" — state not found: ${region.nameAr}`);
        skipped++;
        continue;
      }

      cityBatch.push([stateId, cityEn || cityAr, cityAr, true, IMPORT_USER, IMPORT_USER]);
    }

    async function batchInsert(table, columns, rows, batchSize = 250) {
      if (!rows.length) return;
      const colList = columns.join(', ');
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const values = [];
        const params = [];
        let paramIndex = 1;
        for (const row of chunk) {
          values.push(`(${row.map(() => `$${paramIndex++}`).join(', ')})`);
          params.push(...row);
        }
        await client.query(`INSERT INTO ${table} (${colList}) VALUES ${values.join(', ')}`, params);
      }
    }

    await batchInsert(
      'cities',
      ['state_id', 'name', 'name_ar', 'is_active', 'created_by', 'updated_by'],
      cityBatch,
    );
    const cityCount = cityBatch.length;
    console.log(`Inserted ${cityCount} cities. (${skipped} skipped)`);

    await client.query('COMMIT');

    // Summary
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM countries) AS countries,
        (SELECT COUNT(*) FROM states)    AS states,
        (SELECT COUNT(*) FROM cities)    AS cities
    `);
    console.log('\n✔ Import complete:', stats.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
