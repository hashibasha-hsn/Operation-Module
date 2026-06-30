import pg from 'pg';

const { Pool } = pg;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
};

const databases = [
  'hashibasha_auth',
  'hashibasha_user',
  'hashibasha_org',
  'hashibasha_notification',
  'hashibasha_permission',
];

async function clearDatabase(database) {
  const pool = new Pool({ ...config, database });
  const client = await pool.connect();

  try {
    const { rows } = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (rows.length === 0) {
      console.log(`- ${database}: no tables found`);
      return;
    }

    const tableList = rows.map((row) => `"${row.tablename}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

    console.log(`✓ ${database}: cleared ${rows.length} table(s)`);
    rows.forEach((row) => console.log(`    - ${row.tablename}`));
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log('Clearing all row data (tables will be kept)...\n');

  for (const database of databases) {
    try {
      await clearDatabase(database);
    } catch (error) {
      console.error(`✗ ${database}: ${error.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\nDone.');
}

main().catch((error) => {
  console.error('Failed to clear databases:', error);
  process.exit(1);
});
