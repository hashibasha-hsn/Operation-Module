const path = require('path');
const { Client } = require(path.join(__dirname, '../server/user-service/node_modules/pg'));
const bcrypt = require(path.join(__dirname, '../server/user-service/node_modules/bcrypt'));
const crypto = require('crypto');

async function main() {
  const url =
    'postgresql://postgres.szfyzjkyhfcfbkpjjfuo:D419EAA12c%40%24@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';
  const email = 'admin@hashibasha.com';
  const password = 'ChangeMe123!';
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query('SET search_path TO hashibasha_auth');
  const hash = await bcrypt.hash(password, 10);
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length === 0) {
    const id = crypto.randomUUID();
    await client.query(
      'INSERT INTO users (id, email, "passwordHash", "verificationStatus", "isActive") VALUES ($1, $2, $3, $4, true)',
      [id, email, hash, 'VERIFIED'],
    );
    console.log('Created auth user', email, id);
  } else {
    await client.query('UPDATE users SET "passwordHash" = $1 WHERE email = $2', [hash, email]);
    console.log('Updated password for', email, existing.rows[0].id);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
