/**
 * One-command local database bootstrap for Hashibasha.
 *
 * Usage:
 *   node server/database/setup-all.cjs
 *   node server/database/setup-all.cjs --with-sample-data
 *
 * npm:
 *   npm run setup:db
 *   npm run setup:db:sample
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Client, Pool } = require('pg');
const { getBaseConfig, DATABASES, applyEnvToProcess, poolConfig } = require('./db-config.cjs');

const ROOT = path.join(__dirname, '..', '..');
const WITH_SAMPLE = process.argv.includes('--with-sample-data');
const SKIP_IMPORTS = process.argv.includes('--skip-imports');

applyEnvToProcess();

function log(step, message) {
  console.log(`\n[${ step }] ${message}`);
}

function runNodeScript(relativePath, label) {
  log('run', label);
  const scriptPath = path.join(ROOT, relativePath);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`Step failed: ${label} (${relativePath})`);
  }
}

async function verifyPostgres() {
  log('1/6', 'Checking PostgreSQL connection...');
  const client = new Client(poolConfig('postgres'));
  await client.connect();
  await client.query('SELECT 1');
  await client.end();
  const base = getBaseConfig();
  console.log(`  Connected as ${base.user}@${base.host}:${base.port}`);
}

async function createDatabase(name) {
  const admin = new Client(poolConfig('postgres'));
  await admin.connect();
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name}"`);
      console.log(`  ✓ Created database: ${name}`);
    } else {
      console.log(`  - Database already exists: ${name}`);
    }
  } finally {
    await admin.end();
  }
}

async function applySqlFile(database, fileName) {
  const sqlPath = path.join(__dirname, fileName);
  if (!fs.existsSync(sqlPath)) {
    console.warn(`  ! Skipped missing file: ${fileName}`);
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool(poolConfig(database));
  try {
    await pool.query(sql);
    console.log(`  ✓ Applied ${fileName} → ${database}`);
  } catch (error) {
    const message = error.message?.split('\n')[0] || String(error);
    console.warn(`  ! ${fileName} → ${database}: ${message}`);
    console.warn('    (continuing — tables may already exist from TypeORM or a prior setup)');
  } finally {
    await pool.end();
  }
}

async function createAllDatabases() {
  log('2/6', 'Creating databases...');
  for (const name of Object.values(DATABASES)) {
    await createDatabase(name);
  }
}

async function applyBaseSchemas() {
  log('3/6', 'Applying base schemas...');

  const schemaPlan = [
    { database: DATABASES.auth, files: ['auth-schema.sql'] },
    { database: DATABASES.user, files: ['user-schema.sql', 'designation-schema.sql'] },
    {
      database: DATABASES.org,
      files: ['org-schema.sql', 'entity-schema.sql', 'noticeboard-schema.sql', 'translations-schema.sql'],
    },
    { database: DATABASES.notification, files: ['notification-schema.sql'] },
    { database: DATABASES.permission, files: ['permission-schema.sql'] },
    { database: DATABASES.location, files: ['sa-location-schema.sql'] },
    { database: DATABASES.language, files: ['language-schema.sql'] },
  ];

  for (const { database, files } of schemaPlan) {
    console.log(`\n  Database: ${database}`);
    for (const file of files) {
      await applySqlFile(database, file);
    }
  }
}

async function runMigrations() {
  log('4/6', 'Running migrations...');
  const migrations = [
    'server/database/migrate-entity-fields.js',
    'server/database/migrate-process-fields.js',
    'server/database/migrate-audits-table.js',
    'server/database/migrate-audit-fields.js',
    'server/database/migrate-assessment-fields.cjs',
    'server/database/migrate-submissions-table.js',
    'server/database/migrate-hybrid-assignee.js',
    'server/database/migrate-noticeboard-display-order.cjs',
  ];

  for (const migration of migrations) {
    runNodeScript(migration, path.basename(migration));
  }
}

async function runModuleSetups() {
  log('5/6', 'Setting up feature modules...');
  runNodeScript('server/database/setup-hybrid-assignee-stores.cjs', 'Hybrid assignee stores');
  runNodeScript('server/database/setup-tickets.cjs', 'Tickets schema + defaults');
  runNodeScript('server/database/setup-reporting-modules.cjs', 'Reporting modules schema + defaults');
  runNodeScript('server/database/setup-audit-logs.cjs', 'Audit logs schema');
}

async function runOptionalImports() {
  if (SKIP_IMPORTS) {
    log('6/6', 'Skipping language/location imports (--skip-imports)');
    return;
  }

  log('6/6', 'Importing reference data...');
  runNodeScript('server/database/import-language-data.cjs', 'UI translations (EN/AR)');

  const excelPath = path.join(ROOT, 'أحياء_مدن_السعودية_العنوان_الوطني.xlsx');
  if (fs.existsSync(excelPath)) {
    runNodeScript('server/database/import-sa-location-from-excel.cjs', 'SA location data from Excel');
  } else {
    console.log('  - SA location Excel not found; skip import (optional file in project root)');
  }
}

async function main() {
  console.log('Hashibasha database setup');
  console.log('=========================');
  if (WITH_SAMPLE) {
    console.log('Mode: schema + migrations + module defaults + imports');
  } else {
    console.log('Mode: schema + migrations + module defaults (no translation/location import)');
    console.log('Tip: use --with-sample-data or npm run setup:db:sample for full imports');
  }

  await verifyPostgres();
  await createAllDatabases();
  await applyBaseSchemas();
  await runMigrations();
  await runModuleSetups();

  if (WITH_SAMPLE) {
    await runOptionalImports();
  } else {
    log('6/6', 'Skipping translation/location imports (use --with-sample-data to include)');
  }

  console.log('\n✓ Database setup completed successfully!\n');
  console.log('Next steps:');
  console.log('  1. npm run start:all');
  console.log('  2. npm run seed:admin   (or open http://localhost:3000/admin-setup)');
  console.log('  3. Login at http://localhost:3000/login');
  console.log('');
}

main().catch((error) => {
  console.error('\n✗ Database setup failed:', error.message || error);
  process.exit(1);
});
