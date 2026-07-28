import crypto from 'crypto';

const ADMIN = {
  userId: crypto.randomUUID(),
  email: process.env.ADMIN_EMAIL || 'admin@hashibasha.com',
  password: process.env.ADMIN_PASSWORD || '',
  name: process.env.ADMIN_NAME || 'System Admin',
  employeeId: process.env.ADMIN_EMPLOYEE_ID || 'ADMIN001',
  designation: process.env.ADMIN_DESIGNATION || 'Company Admin',
};

if (!ADMIN.password) {
  console.error('Set ADMIN_PASSWORD (and optionally ADMIN_EMAIL) before running this script.');
  process.exit(1);
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

console.log('Checking services...');
const health = await Promise.all([
  getJson('http://localhost:3002/users?limit=1'),
  getJson('http://localhost:3009/api/auth/check-setup'),
]);
console.log('User service:', health[0].response.status);
console.log('Auth service:', health[1].response.status);

console.log('\nTrying login before seed...');
let loginRes = await getJson('http://localhost:3009/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
});

if (loginRes.response.ok) {
  console.log('Already works:', loginRes.data.user.email);
  process.exit(0);
}

console.log('Login failed:', loginRes.data?.message ?? loginRes.response.status);

const emailCheck = await getJson('http://localhost:3009/api/auth/check-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN.email }),
});

if (!emailCheck.data?.exists) {
  console.log('Creating auth user via API...');
  const authRes = await getJson('http://localhost:3009/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: ADMIN.userId,
      email: ADMIN.email,
      password: ADMIN.password,
      verificationStatus: 'VERIFIED',
    }),
  });
  if (!authRes.response.ok) {
    console.error('Auth create failed', authRes.response.status, authRes.data);
    process.exit(1);
  }
  console.log('Auth user created');
} else {
  console.log('Auth email exists but password invalid — run: npm run reset:admin-password');
  process.exit(1);
}

const userList = await getJson(`http://localhost:3002/users?search=${encodeURIComponent(ADMIN.email)}`);
const existingUser = userList.data?.users?.find((user) => user.email === ADMIN.email);

if (!existingUser) {
  const entitiesRes = await getJson('http://localhost:3009/api/org/entities?organizationId=default-org');
  const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
  const entity = entities[0];
  const userRes = await getJson('http://localhost:3002/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: ADMIN.userId,
      name: ADMIN.name,
      email: ADMIN.email,
      password: ADMIN.password,
      employeeId: ADMIN.employeeId,
      designation: ADMIN.designation,
      entityId: entity?.id ?? null,
      storeName: entity?.storeName || entity?.entityName || 'test',
      validEmail: true,
      isActive: true,
      tags: {},
    }),
  });
  if (!userRes.response.ok) {
    console.error('User create failed', userRes.response.status, userRes.data);
    process.exit(1);
  }
  console.log('User profile created');
}

loginRes = await getJson('http://localhost:3009/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
});

console.log('\nLogin after seed:', loginRes.response.ok ? 'OK' : loginRes.data?.message ?? loginRes.response.status);
if (loginRes.response.ok) {
  console.log('Email:', ADMIN.email);
  console.log('Password:', ADMIN.password);
}
