import pg from 'pg';

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_auth'
};

async function clearUsers() {
  const pool = new pg.Pool(config);
  
  try {
    await pool.connect();
    console.log('Connected to database');
    
    await pool.query('DELETE FROM users');
    console.log('Users table cleared');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearUsers();
