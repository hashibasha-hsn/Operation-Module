const ORG_API = process.env.ORG_API || 'http://localhost:3009/api/org';
const orgId = 'default-org';
const userId = 'admin-user-id';

async function request(path, init) {
  const response = await fetch(`${ORG_API}${path}`, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `${path} failed (${response.status})`);
  }
  return data;
}

async function run() {
  console.log('Testing Issue Tickets API...\n');

  const tags = await request(`/tickets/tags?organizationId=${orgId}`);
  console.log(`✓ GET tags (${tags.length})`);

  const categories = await request(`/tickets/categories?organizationId=${orgId}`);
  console.log(`✓ GET categories (${categories.length})`);

  const rules = await request(`/tickets/rules?organizationId=${orgId}`);
  console.log(`✓ GET rules (${rules.length})`);

  const settings = await request(`/tickets/settings?organizationId=${orgId}`);
  console.log(`✓ GET settings (attachmentMandatory=${settings.attachmentMandatory})`);

  const created = await request('/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test AC Leakage',
      description: 'Automated test ticket',
      storeId: 'store-test-1',
      assignedTo: userId,
      createdBy: 'Test User',
      organizationId: orgId,
      ticketType: 'auto',
      categoryId: categories[1]?.id || categories[0]?.id,
      tags: { 'Issue Type': 'Equipment' },
      attachments: [{ name: 'test.txt', type: 'text/plain', dataUrl: 'data:text/plain;base64,dGVzdA==' }],
    }),
  });
  console.log(`✓ POST ticket (${created.id.slice(0, 8)})`);

  const updated = await request(`/tickets/${created.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress', userId }),
  });
  console.log(`✓ PUT status → ${updated.status}`);

  const commented = await request(`/tickets/${created.id}/comments`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Investigating the issue',
      userId,
      userName: 'Test User',
      timestamp: new Date().toISOString(),
    }),
  });
  console.log(`✓ PUT comment (${commented.comments?.length || 0} comments)`);

  const assigned = await request(
    `/tickets/assigned-to-me?userId=${userId}&organizationId=${orgId}`,
  );
  console.log(`✓ GET assigned-to-me (${assigned.length})`);

  const report = await request(
    `/tickets/reports/org-report?organizationId=${orgId}`,
  );
  console.log(`✓ GET org-report (total=${report.totalTickets})`);

  const search = await request(
    `/tickets/reports/advance-search?organizationId=${orgId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    },
  );
  console.log(`✓ POST advance-search (${search.length})`);

  console.log('\nAll ticket flow tests passed.');
}

run().catch((error) => {
  console.error('\nTicket flow test failed:', error.message);
  process.exit(1);
});
