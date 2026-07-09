/**
 * Reset auth + user account data (Supabase or local PostgreSQL).
 *
 * Usage:
 *   node server/database/reset-auth-user-data.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvFile(path.join(__dirname, '..', 'auth-service', '.env'));

const AUTH_TABLES = ['refresh_tokens', 'sessions', 'users'];
const USER_TABLES = [
  'team_members',
  'user_teams',
  'user_tags',
  'user_designations',
  'org_memberships',
  'user_profiles',
  'removed_users',
  'assignee_profile_users',
];

async function tableExists(client, schema, table) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table],
  );
  return res.rowCount > 0;
}

async function truncateIfExists(client, schema, table) {
  if (!(await tableExists(client, schema, table))) {
    console.log(`  - skip ${schema}.${table} (not found)`);
    return;
  }
  await client.query(`TRUNCATE TABLE "${schema}"."${table}" CASCADE`);
  console.log(`  ✓ truncated ${schema}.${table}`);
}

async function main() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('Resetting auth + user account data...\n');

  console.log('Auth schema (hashibasha_auth):');
  for (const table of AUTH_TABLES) {
    await truncateIfExists(client, 'hashibasha_auth', table);
  }

  console.log('\nUser schema (hashibasha_user):');
  for (const table of USER_TABLES) {
    await truncateIfExists(client, 'hashibasha_user', table);
  }

  const check = await client.query('SELECT COUNT(*)::int AS count FROM hashibasha_auth.users');
  await client.end();

  console.log(`\nAuth users remaining: ${check.rows[0].count}`);
  console.log('Done. Open http://localhost:3000/admin-setup to create the admin user.');
  console.log('Tip: clear browser localStorage (or log out) if you were logged in before.');
}

main().catch((error) => {
  console.error('\nReset failed:', error.message || error);
  process.exit(1);
});
