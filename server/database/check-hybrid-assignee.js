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
    WHERE table_schema = 'public' AND table_name LIKE 'hybrid%'
    ORDER BY table_name
  `);
  console.log('=== TABLES ===');
  console.log(tables.rows.map((r) => r.table_name).join(', ') || '(none)');

  for (const t of tables.rows) {
    const cols = await client.query(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1 ORDER BY ordinal_position
    `,
      [t.table_name],
    );
    console.log(`\n=== COLUMNS: ${t.table_name} ===`);
    cols.rows.forEach((c) => {
      console.log(
        `  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default ?? 'null'}`,
      );
    });
  }

  const constraints = await client.query(`
    SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid::regclass::text LIKE 'hybrid%'
    ORDER BY 1, 2
  `);
  console.log('\n=== CONSTRAINTS ===');
  constraints.rows.forEach((c) => {
    console.log(`${c.table_name} | ${c.conname} | ${c.def}`);
  });

  const counts = await client.query(`
    SELECT 'profiles' AS tbl, COUNT(*)::int AS cnt FROM hybrid_assignee_profiles
    UNION ALL SELECT 'assignments', COUNT(*)::int FROM hybrid_assignee_assignments
  `);
  console.log('\n=== ROW COUNTS ===');
  console.log(counts.rows);

  const types = await client.query(`
    SELECT assignmenttype, COUNT(*)::int AS cnt
    FROM hybrid_assignee_assignments GROUP BY assignmenttype ORDER BY assignmenttype
  `);
  console.log('\n=== ASSIGNMENT TYPES IN DB ===');
  console.log(types.rows.length ? types.rows : '(no assignments)');

  const sample = await client.query(`
    SELECT p.id, p.name, p.ispublished, p.isactive,
      (SELECT COUNT(DISTINCT userid) FROM hybrid_assignee_assignments a WHERE a.profileid = p.id AND a.userid IS NOT NULL) AS users,
      (SELECT COUNT(DISTINCT storeid) FROM hybrid_assignee_assignments a WHERE a.profileid = p.id AND a.storeid IS NOT NULL) AS stores
    FROM hybrid_assignee_profiles p ORDER BY p.createdat DESC LIMIT 5
  `);
  console.log('\n=== SAMPLE PROFILES (latest 5) ===');
  console.log(JSON.stringify(sample.rows, null, 2));

  const expectedTypes = ['individual', 'bulk', 'designation', 'common'];
  const constraintRow = constraints.rows.find((c) =>
    c.conname.includes('assignmenttype_check'),
  );
  const missingTypes = expectedTypes.filter(
    (t) => !constraintRow?.def?.includes(`'${t}'`),
  );
  console.log('\n=== MIGRATION CHECK ===');
  if (missingTypes.length === 0) {
    console.log('OK: assignmenttype check includes individual, bulk, designation, common');
  } else {
    console.log('MISSING from check constraint:', missingTypes.join(', '));
    console.log('Run: node server/database/migrate-hybrid-assignee.js');
  }

  const useridCol = (
    await client.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'hybrid_assignee_assignments' AND column_name = 'userid'
    `)
  ).rows[0];
  if (useridCol?.data_type?.includes('character')) {
    console.log('OK: userid column is varchar (matches entity)');
  } else {
    console.log('WARN: userid column type is', useridCol?.data_type, '- migration may be needed');
  }
} finally {
  client.release();
  await pool.end();
}
