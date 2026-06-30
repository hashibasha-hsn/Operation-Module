const baseUrl = 'http://localhost:3002/hybrid-assignee-profiles';
const orgId = 'default-org';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function cleanupProfile(id) {
  if (id) {
    await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  }
}

const usersRes = await getJson('http://localhost:3002/users?limit=5');
const userId = usersRes.data?.users?.[0]?.userId;
if (!userId) {
  console.error('No users available for test');
  process.exit(1);
}

const entitiesRes = await getJson('http://localhost:3009/api/org/entities?organizationId=default-org');
const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
const storeId = entities[0]?.id;
if (!storeId) {
  console.error('No entities available for test');
  process.exit(1);
}

let profileId = null;

try {
  console.log('1. Load dashboard');
  const dashboardRes = await getJson(`${baseUrl}/dashboard?organizationId=${orgId}`);
  if (!dashboardRes.response.ok) {
    console.error('Dashboard failed', dashboardRes.data);
    process.exit(1);
  }
  console.log('   Stats:', dashboardRes.data.stats);

  console.log('2. Create profile');
  const createRes = await getJson(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Matrix Profile ${Date.now()}`,
      organizationId: orgId,
    }),
  });
  if (!createRes.response.ok) {
    console.error('Create failed', createRes.data);
    process.exit(1);
  }
  profileId = createRes.data.id;
  console.log('   Created:', profileId, createRes.data.name);

  console.log('3. Add store to matrix');
  const addStoresRes = await getJson(`${baseUrl}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: orgId, storeIds: [storeId] }),
  });
  if (!addStoresRes.response.ok) {
    console.error('Add stores failed', addStoresRes.data);
    process.exit(1);
  }
  console.log('   Active stores:', addStoresRes.data.stats.activeStores);

  console.log('4. Assign user to store/profile cell');
  const cellRes = await getJson(`${baseUrl}/${profileId}/cell`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, userIds: [userId] }),
  });
  if (!cellRes.response.ok) {
    console.error('Cell update failed', cellRes.data);
    process.exit(1);
  }
  const cellKey = `${storeId}:${profileId}`;
  console.log('   Cell users:', cellRes.data.cells[cellKey]?.length ?? 0);

  console.log('5. Publish profile');
  const publishRes = await getJson(`${baseUrl}/${profileId}/publish`, { method: 'POST' });
  if (!publishRes.response.ok) {
    console.error('Publish failed', publishRes.data);
    process.exit(1);
  }
  console.log('   Published:', publishRes.data.isPublished);

  console.log('6. Lookup individual assignees');
  const lookupRes = await getJson(
    `${baseUrl}/lookup/users?storeId=${storeId}&assignmentType=individual&organizationId=${orgId}`,
  );
  if (!lookupRes.response.ok) {
    console.error('Lookup failed', lookupRes.data);
    process.exit(1);
  }
  console.log('   Lookup count:', lookupRes.data?.length ?? 0);

  console.log('7. Rename profile');
  const renameRes = await getJson(`${baseUrl}/${profileId}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Updated Matrix Profile' }),
  });
  if (!renameRes.response.ok) {
    console.error('Rename failed', renameRes.data);
    process.exit(1);
  }
  console.log('   Renamed:', renameRes.data.name);

  console.log('\nHybrid assignee matrix workflow test passed.');
} finally {
  await cleanupProfile(profileId);
  await fetch(`${baseUrl}/stores/${storeId}?organizationId=${orgId}`, { method: 'DELETE' });
}
