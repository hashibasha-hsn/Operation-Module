import pg from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  database: process.env.AUTH_DB_NAME || 'hashibasha_auth',
};

const email = process.env.ADMIN_EMAIL || 'admin@hashibasha.com';
const password = process.env.ADMIN_PASSWORD || '';

async function updatePassword() {
  if (!password) {
    console.error('Set ADMIN_PASSWORD (and optionally ADMIN_EMAIL) before running this script.');
    process.exit(1);
  }
  const pool = new pg.Pool(config);

  try {
    const client = await pool.connect();
    console.log('Connected to auth database');

    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    if (existing.rows.length === 0) {
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO users (id, email, "passwordHash", "verificationStatus", "isActive")
         VALUES ($1, $2, $3, 'VERIFIED', true)`,
        [id, email, hashedPassword],
      );
      console.log('Created admin user:', email);
    } else {
      await client.query(
        `UPDATE users SET "passwordHash" = $1, "verificationStatus" = 'VERIFIED' WHERE email = $2`,
        [hashedPassword, email],
      );
      console.log('Updated password for:', email);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();
