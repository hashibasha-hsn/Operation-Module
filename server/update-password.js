import pg from 'pg';
import bcrypt from 'bcrypt';

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_auth'
};

async function updatePassword() {
  const pool = new pg.Pool(config);
  
  try {
    await pool.connect();
    console.log('Connected to database');
    
    // Hash the demo password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Password hashed');
    
    // Update the user's email and password
    await pool.query(
      'UPDATE users SET email = $1, password_hash = $2 WHERE email IS NOT NULL LIMIT 1',
      ['admin@hashibasha.com', hashedPassword]
    );
    console.log('User updated successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();
