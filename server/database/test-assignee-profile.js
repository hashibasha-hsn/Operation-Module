const baseUrl = 'http://localhost:3002';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

const usersRes = await getJson(`${baseUrl}/users?limit=3`);
const userProfileId = usersRes.data?.users?.[0]?.id;
if (!userProfileId) {
  console.error('No users available');
  process.exit(1);
}

const entitiesRes = await getJson('http://localhost:3009/api/org/entities?organizationId=default-org');
const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
const storeId = entities[0]?.id;
if (!storeId) {
  console.error('No stores available');
  process.exit(1);
}

console.log('1. Create assignee profile');
const createRes = await getJson(`${baseUrl}/tags/assignee-profile`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileName: 'North Zone Ops',
    storeIds: [storeId],
    userIds: [userProfileId],
    organizationId: 'default-org',
  }),
});

if (!createRes.response.ok) {
  console.error('Create failed', createRes.response.status, createRes.data);
  process.exit(1);
}
console.log('   Created:', createRes.data.id, createRes.data.profileName);
console.log('   Users:', createRes.data.users?.length, 'Stores:', createRes.data.storeIds?.length);

const profileId = createRes.data.id;

console.log('2. List profiles');
const listRes = await getJson(`${baseUrl}/tags/assignee-profile?organizationId=default-org`);
console.log('   Count:', listRes.data?.length);

console.log('3. Update profile');
const updateRes = await getJson(`${baseUrl}/tags/assignee-profile/${profileId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileName: 'VM Leads',
    storeIds: [storeId],
    userIds: [userProfileId],
  }),
});
if (!updateRes.response.ok) {
  console.error('Update failed', updateRes.response.status, updateRes.data);
  process.exit(1);
}
console.log('   Updated name:', updateRes.data.profileName);
console.log('   Users after update:', updateRes.data.users?.length);

console.log('4. Get single profile');
const getRes = await getJson(`${baseUrl}/tags/assignee-profile/${profileId}`);
console.log('   Users:', getRes.data?.users?.map((u) => u.name).join(', '));

console.log('5. Delete profile');
const delRes = await fetch(`${baseUrl}/tags/assignee-profile/${profileId}`, { method: 'DELETE' });
console.log('   Delete status:', delRes.status);

const dbCheck = await getJson('http://localhost:3002/tags/assignee-profile?organizationId=default-org');
const leftover = dbCheck.data?.find((p) => p.id === profileId);
if (leftover) {
  console.error('Profile still exists after delete');
  process.exit(1);
}

console.log('\nAssignee profile test passed.');
