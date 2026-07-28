import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_org',
});

const client = await pool.connect();
try {
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'process%'
    ORDER BY table_name
  `);
  for (const row of tables.rows) {
    const cols = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [row.table_name],
    );
    console.log(`\n=== ${row.table_name} ===`);
    cols.rows.forEach((c) => console.log(`  ${c.column_name} | ${c.data_type}`));
  }
} finally {
  client.release();
  await pool.end();
}
