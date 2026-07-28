import pg from 'pg';

const authPool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_auth',
});

const userPool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_user',
});

async function checkService(name, url) {
  try {
    const res = await fetch(url);
    console.log(`${name}: HTTP ${res.status}`);
    return res.ok;
  } catch (error) {
    console.log(`${name}: DOWN (${error.message})`);
    return false;
  }
}

console.log('=== Service health ===');
await checkService('User service', 'http://localhost:3002/users?limit=1');
await checkService('Auth service (direct)', 'http://localhost:3003/auth/check-setup');
await checkService('Gateway auth', 'http://localhost:3009/api/auth/check-setup');

console.log('\n=== Auth DB: admin@hashibasha.com ===');
const authClient = await authPool.connect();
try {
  const authUsers = await authClient.query(
    `SELECT id, email, "passwordHash", "verificationStatus" FROM users WHERE email = $1`,
    ['admin@hashibasha.com'],
  );
  if (authUsers.rows.length === 0) {
    console.log('NOT FOUND in hashibasha_auth.users');
  } else {
    const row = authUsers.rows[0];
    console.log('Found:', row.id, row.verificationStatus, 'hash prefix:', String(row.passwordHash).slice(0, 7));
  }

  console.log('\nAll auth users:');
  const allAuth = await authClient.query(`SELECT email, "verificationStatus" FROM users ORDER BY email`);
  allAuth.rows.forEach((r) => console.log(`  - ${r.email} (${r.verificationStatus})`));
} finally {
  authClient.release();
}

console.log('\n=== User DB: admin@hashibasha.com ===');
const userClient = await userPool.connect();
try {
  const userRows = await userClient.query(
    `SELECT "userId", email, password, name FROM user_profiles WHERE email = $1`,
    ['admin@hashibasha.com'],
  );
  if (userRows.rows.length === 0) {
    console.log('NOT FOUND in hashibasha_user.user_profiles');
  } else {
    const row = userRows.rows[0];
    console.log('Found:', row.userId, row.name, 'stored password:', row.password);
  }
} finally {
  userClient.release();
}

console.log('\n=== Login test via gateway ===');
const loginRes = await fetch('http://localhost:3009/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@hashibasha.com', password: 'admin123' }),
});
const loginData = await loginRes.json().catch(() => null);
console.log('Login status:', loginRes.status, loginRes.ok ? 'OK' : loginData?.message ?? loginData);

await authPool.end();
await userPool.end();
