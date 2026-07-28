const ORG_API = process.env.ORG_API || 'http://localhost:3009/api/org';

async function request(path, init) {
  const response = await fetch(`${ORG_API}${path}`, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `${path} failed (${response.status})`);
  }
  return data;
}

async function run() {
  console.log('Testing Audit Logs API...\n');

  const created = await request('/audit-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target: 'Form Submission',
      operation: 'Update',
      performedBy: 'admin@hashibasha.com',
      details: {
        title: 'Test Process Form',
        FormId: 'test-form-id',
      },
      organizationId: 'default-org',
    }),
  });
  console.log(`✓ POST audit-log (${created.id.slice(0, 8)})`);

  const list = await request(
    '/audit-logs?organizationId=default-org&page=1&limit=10&sort=desc',
  );
  console.log(`✓ GET audit-logs (${list.logs?.length || 0} rows, total=${list.total})`);

  const today = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  const startDate = start.toISOString().slice(0, 10);

  const filtered = await request(
    `/audit-logs?organizationId=default-org&startDate=${startDate}&endDate=${today}&page=1&limit=5`,
  );
  console.log(`✓ GET date-filtered (${filtered.logs?.length || 0} rows)`);

  if (!list.logs?.length) {
    throw new Error('Expected at least one audit log');
  }

  console.log('\nAll audit log tests passed.');
}

run().catch((error) => {
  console.error('\nAudit log test failed:', error.message);
  process.exit(1);
});
