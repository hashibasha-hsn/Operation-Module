const ORG_API = process.env.ORG_API || 'http://localhost:3009/api/org';
const USER_API = process.env.USER_API || 'http://localhost:3009/api/user';

async function request(url, init, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    console.log(`${label}: ${response.status}`, typeof data === 'string' ? data.slice(0, 200) : data);
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`${label}: FAILED`, error.message);
    return { ok: false, status: 0, data: null, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  console.log('Finding user Rasika...\n');

  const usersRes = await request(`${USER_API}/users?limit=200`, undefined, 'GET users');
  const users = usersRes.data?.users || [];
  const rasika =
    users.find((u) => String(u.name || '').toLowerCase() === 'rasika') ||
    users.find((u) => String(u.name || '').toLowerCase().includes('rasika'));

  if (!rasika) {
    console.error('User Rasika not found. Available names:', users.map((u) => u.name).slice(0, 20));
    process.exit(1);
  }

  console.log(`Found Rasika: name="${rasika.name}" userId="${rasika.userId}"\n`);

  const entitiesRes = await request(`${ORG_API}/entities?organizationId=default-org`, undefined, 'GET entities');
  const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
  const storeId = entities[0]?.id || 'store-test-1';
  console.log(`Using storeId: ${storeId}\n`);

  const payload = {
    title: 'Test ticket for Rasika',
    description: 'Automated test - assigned to Rasika',
    storeId,
    assignedTo: rasika.userId,
    createdBy: 'Admin',
    organizationId: 'default-org',
    ticketType: 'custom',
    priority: 'medium',
    status: 'open',
  };

  const directOrg = await request(
    'http://localhost:3012/tickets',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'POST ticket (direct org-service)',
  );

  const viaGateway = await request(
    `${ORG_API}/tickets`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'POST ticket (via gateway)',
  );

  if (viaGateway.ok || directOrg.ok) {
    const ticket = viaGateway.data || directOrg.data;
    console.log('\nTicket created successfully:', ticket?.id, 'assignedTo', ticket?.assignedTo);
    process.exit(0);
  }

  process.exit(1);
}

run();
