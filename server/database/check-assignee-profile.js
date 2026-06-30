import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_user',
});

const client = await pool.connect();
try {
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'assignee%'
    ORDER BY table_name
  `);
  console.log('=== TABLES ===');
  console.log(tables.rows.map((r) => r.table_name).join(', ') || '(none)');

  for (const t of tables.rows) {
    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [t.table_name],
    );
    console.log(`\n=== COLUMNS: ${t.table_name} ===`);
    cols.rows.forEach((c) => console.log(`  ${c.column_name} | ${c.data_type}`));
  }

  const constraints = await client.query(`
    SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid::regclass::text LIKE 'assignee%'
    ORDER BY 1, 2
  `);
  console.log('\n=== CONSTRAINTS ===');
  constraints.rows.forEach((c) => console.log(`${c.table_name} | ${c.conname} | ${c.def}`));

  const counts = await client.query(`
    SELECT 'profiles' AS tbl, COUNT(*)::int AS cnt FROM assignee_profiles
    UNION ALL SELECT 'profile_users', COUNT(*)::int FROM assignee_profile_users
  `);
  console.log('\n=== ROW COUNTS ===');
  console.log(counts.rows);

  const sample = await client.query(`
    SELECT p.id, p."profileName", p."storeIds", p."isActive",
      (SELECT COUNT(*)::int FROM assignee_profile_users u WHERE u."profileId" = p.id) AS user_count
    FROM assignee_profiles p
    ORDER BY p."createdAt" DESC LIMIT 5
  `);
  console.log('\n=== SAMPLE PROFILES ===');
  console.log(JSON.stringify(sample.rows, null, 2));

  console.log('\n=== SCHEMA CHECK ===');
  const requiredProfileCols = ['id', 'profileName', 'organizationId', 'storeIds', 'isActive'];
  const profileCols = (
    await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'assignee_profiles'
    `)
  ).rows.map((r) => r.column_name);
  const missingProfile = requiredProfileCols.filter((c) => !profileCols.includes(c));
  if (missingProfile.length === 0) {
    console.log('OK: assignee_profiles has required columns');
  } else {
    console.log('MISSING columns on assignee_profiles:', missingProfile.join(', '));
  }

  const junctionCols = (
    await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'assignee_profile_users'
    `)
  ).rows.map((r) => r.column_name);
  if (junctionCols.includes('profileId') && junctionCols.includes('userId')) {
    console.log('OK: assignee_profile_users junction table exists');
  } else {
    console.log('WARN: assignee_profile_users missing profileId/userId columns');
  }
} finally {
  client.release();
  await pool.end();
}
