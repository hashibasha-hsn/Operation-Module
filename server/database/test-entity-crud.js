const baseUrl = 'http://localhost:3009/api/org/entities';
const organizationId = 'default-org';

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const uniqueSuffix = Date.now();
const entityId = `ENT-CRUD-${uniqueSuffix}`;
const originalName = `Searchable Store ${uniqueSuffix}`;
const updatedName = `Updated Store ${uniqueSuffix}`;

const createPayload = {
  storeName: originalName,
  entityId,
  area: 'Al Olaya',
  city: 'Riyadh',
  region: 'Riyadh Region',
  staff: 8,
  status: true,
  storeStatus: 'Functional',
  latitude: 24.686,
  longitude: 46.722,
  storeRadius: 150,
  organizationId,
  tags: {},
};

console.log('Entity CRUD + search API test\n');

console.log('1. POST /entities');
const createRes = await request(baseUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createPayload),
});
assert(createRes.response.ok, `Create failed: ${createRes.response.status} ${JSON.stringify(createRes.data)}`);
const created = createRes.data;
assert(created?.id, 'Create response missing id');
assert(created.storeName === originalName, 'Create response storeName mismatch');
console.log(`   Created entity id=${created.id}`);

console.log('2. GET /entities/:id');
const getRes = await request(`${baseUrl}/${created.id}`);
assert(getRes.response.ok, `Get by id failed: ${getRes.response.status}`);
assert(getRes.data?.entityId === entityId, 'Get by id entityId mismatch');
console.log('   Get by id passed');

console.log('3. GET /entities?organizationId=...');
const listRes = await request(`${baseUrl}?organizationId=${organizationId}`);
assert(listRes.response.ok, `List failed: ${listRes.response.status}`);
assert(Array.isArray(listRes.data), 'List response is not an array');
assert(
  listRes.data.some((item) => item.id === created.id),
  'Created entity not found in list',
);
console.log(`   List returned ${listRes.data.length} entities`);

console.log('4. GET /entities?search=...');
const searchRes = await request(
  `${baseUrl}?organizationId=${organizationId}&search=${encodeURIComponent('Searchable Store')}`,
);
assert(searchRes.response.ok, `Search failed: ${searchRes.response.status}`);
assert(Array.isArray(searchRes.data), 'Search response is not an array');
assert(
  searchRes.data.some((item) => item.id === created.id),
  'Created entity not found by search',
);
const missRes = await request(
  `${baseUrl}?organizationId=${organizationId}&search=${encodeURIComponent('___no-match___')}`,
);
assert(missRes.response.ok, `Negative search failed: ${missRes.response.status}`);
assert(
  missRes.data.length === 0,
  `Negative search should return no entities, got ${missRes.data.length}`,
);
console.log('   Search by store name passed');

console.log('5. PUT /entities/:id');
const updateRes = await request(`${baseUrl}/${created.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeName: updatedName,
    staff: 12,
  }),
});
assert(updateRes.response.ok, `Update failed: ${updateRes.response.status}`);
assert(updateRes.data?.storeName === updatedName, 'Update response storeName mismatch');
assert(updateRes.data?.staff === 12, 'Update response staff mismatch');
console.log('   Update passed');

console.log('6. DELETE /entities/:id');
const deleteRes = await request(`${baseUrl}/${created.id}`, { method: 'DELETE' });
assert(deleteRes.response.ok, `Delete failed: ${deleteRes.response.status}`);
const afterDeleteRes = await request(`${baseUrl}/${created.id}`);
assert(
  afterDeleteRes.data == null || !afterDeleteRes.data?.id,
  'Entity still exists after delete',
);
console.log('   Delete passed');

console.log('\nAll entity CRUD + search tests passed.');
