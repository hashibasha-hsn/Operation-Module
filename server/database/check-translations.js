import pg from 'pg';

const { Pool } = pg;

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_org'
};

async function checkTranslations() {
  const pool = new Pool(config);
  
  try {
    console.log('Connecting to hashibasha_org database...');
    await pool.connect();
    console.log('Connected successfully!');

    // Check if translations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'translations'
      );
    `);
    console.log('Translations table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Count translations
      const countResult = await pool.query('SELECT COUNT(*) as count FROM translations');
      console.log('Total translations:', countResult.rows[0].count);

      // Show sample translations
      const sampleResult = await pool.query('SELECT key, en, ar FROM translations LIMIT 5');
      console.log('Sample translations:');
      sampleResult.rows.forEach(row => {
        console.log(`  ${row.key}: EN="${row.en}", AR="${row.ar}"`);
      });

      // Check for specific keys used in Dashboard
      const dashboardKeys = ['activityOverview', 'pending', 'inProgress', 'completed', 'assigned'];
      console.log('\nDashboard translations:');
      for (const key of dashboardKeys) {
        const result = await pool.query('SELECT en, ar FROM translations WHERE key = $1', [key]);
        if (result.rows.length > 0) {
          console.log(`  ${key}: EN="${result.rows[0].en}", AR="${result.rows[0].ar}"`);
        } else {
          console.log(`  ${key}: NOT FOUND`);
        }
      }
    } else {
      console.log('Translations table does not exist!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error checking translations:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTranslations();
