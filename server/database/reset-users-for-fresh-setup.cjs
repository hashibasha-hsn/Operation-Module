const { Pool } = require('pg');

const CONFIG = {
  host: process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543', 10),
  user: process.env.DB_USER || 'postgres.nwwcoukuvyqnbxulvqcl',
  password: process.env.DB_PASSWORD || 'D419EAA12b!Secure',
  database: process.env.DB_NAME || 'postgres',
  ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
};

// Clears all user accounts and user-scoped data so /admin-setup can
// create a fresh first admin (who becomes the super admin). Keeps
// reference/seed data (roles, features, designations, locations, etc.).
const TRUNCATE = [
  // auth accounts, sessions
  'hashibasha_auth.refresh_tokens',
  'hashibasha_auth.sessions',
  'hashibasha_auth.users',

  // user profiles + memberships
  'hashibasha_user.team_members',
  'hashibasha_user.user_teams',
  'hashibasha_user.user_tags',
  'hashibasha_user.user_designations',
  'hashibasha_user.org_memberships',
  'hashibasha_user.user_profiles',

  // user-scoped permission data
  'hashibasha_permission.permission_audit_logs',
  'hashibasha_permission.permission_cache',
  'hashibasha_permission.role_change_history',
  'hashibasha_permission.scope_access',

  // user-scoped notification data
  'hashibasha_notification.notification_preferences',
  'hashibasha_notification.notifications',
  'hashibasha_notification.delivery_logs',
];

const TRUNCATE_IF_EXISTS = [
  'hashibasha_user.removed_users',
  'hashibasha_user.assignee_profile_users',
  'hashibasha_user.hybrid_assignee_assignments',
];

async function main() {
  const pool = new Pool(CONFIG);
  const client = await pool.connect();
  try {
    const tables = [...TRUNCATE, ...TRUNCATE_IF_EXISTS];
    for (const table of tables) {
      try {
        const res = await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`OK    ${table}${res.rowCount != null && res.rowCount >= 0 ? '' : ''}`);
      } catch (err) {
        console.log(`SKIP  ${table} (${err.message.split('\n')[0]})`);
      }
    }

    const users = await client.query(
      `SELECT count(*)::int AS c FROM hashibasha_auth.users`,
    );
    const profiles = await client.query(
      `SELECT count(*)::int AS c FROM hashibasha_user.user_profiles`,
    );
    console.log(`\nRemaining: ${users.rows[0].c} auth users, ${profiles.rows[0].c} user profiles`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
