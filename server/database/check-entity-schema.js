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
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'entities'
    ORDER BY ordinal_position
  `);
  console.log('=== entities columns ===');
  cols.rows.forEach((c) => {
    console.log(`${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable}`);
  });

  const removed = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'removed_entities'
    ORDER BY ordinal_position
  `);
  console.log('\n=== removed_entities columns ===');
  removed.rows.forEach((c) => console.log(`${c.column_name} | ${c.data_type}`));
} finally {
  client.release();
  await pool.end();
}
