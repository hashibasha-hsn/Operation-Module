/**
 * Migrate local PostgreSQL databases to Supabase schemas (Node.js only).
 *
 * Prerequisites:
 *   1. Run server/database/supabase-schemas.sql in Supabase SQL Editor
 *   2. Start services once so TypeORM creates tables (npm run start:all)
 *
 * Usage:
 *   node server/database/migrate-to-supabase.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..', '..');
const AUTH_ENV = path.join(ROOT, 'server', 'auth-service', '.env');

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
      (val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const remoteEnv = loadEnvFile(AUTH_ENV);

const LOCAL = {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  port: parseInt(process.env.LOCAL_DB_PORT || '5432', 10),
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'Rasika',
};

const REMOTE = remoteEnv.DATABASE_URL
  ? {
      connectionString: remoteEnv.DATABASE_URL,
      ssl: remoteEnv.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: remoteEnv.DB_HOST,
      port: parseInt(remoteEnv.DB_PORT || '5432', 10),
      user: remoteEnv.DB_USER,
      password: remoteEnv.DB_PASSWORD,
      database: remoteEnv.DB_NAME || 'postgres',
      ssl: remoteEnv.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const DATABASES = {
  hashibasha_auth: 'hashibasha_auth',
  hashibasha_user: 'hashibasha_user',
  hashibasha_org: 'hashibasha_org',
  hashibasha_notification: 'hashibasha_notification',
  hashibasha_permission: 'hashibasha_permission',
  hashibasha_location: 'hashibasha_location',
  hashibasha_language: 'hashibasha_language',
};

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function schemaRef(schema) {
  return quoteIdent(schema);
}

async function verifyConnections() {
  console.log('Checking local PostgreSQL...');
  const local = new Client({ ...LOCAL, database: 'postgres' });
  await local.connect();
  await local.query('SELECT 1');
  await local.end();
  console.log('  Local OK');

  console.log('Checking Supabase...');
  const remote = new Client({ ...REMOTE });
  await remote.connect();
  await remote.query('SELECT 1');
  await remote.end();
  console.log('  Supabase OK');
}

async function getTables(client, schema = 'public') {
  const res = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schema],
  );
  return res.rows.map((row) => row.table_name);
}

async function getColumns(client, schema, table) {
  const res = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  );
  return res.rows.map((row) => row.column_name);
}

async function copyTable(localClient, remoteClient, table, targetSchema) {
  const localColumns = await getColumns(localClient, 'public', table);
  if (localColumns.length === 0) return 0;

  const remoteColumns = await getColumns(remoteClient, targetSchema, table);
  const columns = localColumns.filter((col) => remoteColumns.includes(col));
  if (columns.length === 0) {
    console.log(`    - skip ${table} (not in Supabase schema yet)`);
    return 0;
  }

  const { rows } = await localClient.query(`SELECT * FROM ${quoteIdent(table)}`);
  if (rows.length === 0) return 0;

  const colList = columns.map(quoteIdent).join(', ');
  const fullTable = `${schemaRef(targetSchema)}.${quoteIdent(table)}`;
  const chunkSize = 200;
  let copied = 0;

  await remoteClient.query('BEGIN');
  try {
    await remoteClient.query(`TRUNCATE TABLE ${fullTable} CASCADE`);
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const values = [];
      const placeholders = chunk
        .map((row, rowIndex) => {
          const base = rowIndex * columns.length;
          columns.forEach((col) => values.push(row[col]));
          const ph = columns.map((_, colIndex) => `$${base + colIndex + 1}`).join(', ');
          return `(${ph})`;
        })
        .join(', ');
      await remoteClient.query(
        `INSERT INTO ${fullTable} (${colList}) VALUES ${placeholders}`,
        values,
      );
      copied += chunk.length;
    }
    await remoteClient.query('COMMIT');
  } catch (error) {
    await remoteClient.query('ROLLBACK');
    throw error;
  }

  return copied;
}

async function migrateDatabase(localDb, targetSchema) {
  const localClient = new Client({ ...LOCAL, database: localDb });
  try {
    await localClient.connect();
  } catch (error) {
    if (/does not exist/i.test(error.message)) {
      console.log(`  - Skipping missing local database: ${localDb}`);
      return;
    }
    throw error;
  }

  const remoteClient = new Client({ ...REMOTE });
  await remoteClient.connect();

  try {
    const tables = await getTables(localClient, 'public');
    console.log(`  Tables found locally: ${tables.length}`);
    for (const table of tables) {
      try {
        const count = await copyTable(localClient, remoteClient, table, targetSchema);
        if (count > 0) console.log(`    ✓ ${table}: ${count} rows`);
      } catch (error) {
        console.warn(`    ! ${table}: ${error.message.split('\n')[0]}`);
      }
    }
  } finally {
    await localClient.end();
    await remoteClient.end();
  }
}

async function main() {
  console.log('Hashibasha -> Supabase data migration');
  console.log('====================================');
  console.log(`Local:  ${LOCAL.user}@${LOCAL.host}:${LOCAL.port}`);
  console.log(`Remote: ${remoteEnv.DATABASE_URL ? 'DATABASE_URL (Supabase pooler)' : `${REMOTE.user}@${REMOTE.host}:${REMOTE.port}/${REMOTE.database}`}\n`);

  await verifyConnections();

  for (const [database, schema] of Object.entries(DATABASES)) {
    console.log(`\n${database} -> ${schema}`);
    await migrateDatabase(database, schema);
  }

  console.log('\n✓ Data migration complete.');
  console.log('Next: npm run seed:admin (if admin login is needed)');
}

main().catch((error) => {
  console.error('\n✗ Migration failed:', error.message || error);
  process.exit(1);
});
