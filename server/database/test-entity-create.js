const baseUrl = 'http://localhost:3009/api/org/entities';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

const entityId = `ENT-TEST-${Date.now()}`;
const payload = {
  storeName: 'North Branch Test',
  entityId,
  area: 'Central',
  city: 'Riyadh',
  staff: 12,
  status: true,
  storeStatus: 'Functional',
  latitude: 24.686,
  longitude: 46.722,
  storeRadius: 150,
  organizationId: 'default-org',
  tags: { tag_1: 'premium' },
  registrationName: 'Hashi Basha Holding Company',
  companyId: 'COMP-001',
  taxSchemeId: 'VAT',
  businessCategory: 'food and beverage services',
  businessIdentificationId: '1010123456',
  identificationScheme: 'CRN',
  streetName: 'King Fahd Road',
  districtName: 'Olaya',
  cityName: 'Riyadh',
  buildingNumber: '1234',
  postalZone: '11564',
  countryIdentificationCode: 'SA',
  csrIndustryBusinessCategory: 'Retail',
  csrCommonName: 'Test CSR',
  csrSerialNumber: 'SN-001',
  csrOrganizationIdentifier: 'ORG-001',
  csrOrganizationUnitName: 'Finance',
  csrOrganizationName: 'Hashi Basha',
  csrCountryName: 'SA',
  csrInvoiceType: 'Standard',
  csrLocationAddress: 'Riyadh HQ',
  csrEnvironmentType: 'NonProduction',
  generatedCsr: '-----BEGIN CERTIFICATE REQUEST-----\nTEST\n-----END CERTIFICATE REQUEST-----',
  generatedPrivateKey: '-----BEGIN EC PRIVATE KEY-----\nTEST\n-----END EC PRIVATE KEY-----',
  ccsidOtp: '123456',
  ccsidBinaryToken: 'CCSID_TOKEN',
  tokenSecret: 'secret-token',
  requestId: 'REQ-001',
  pcsidBinaryToken: 'PCSID_TOKEN',
  pcsidSecret: 'pcsid-secret',
  registeredDate: new Date().toISOString(),
};

console.log('1. Create entity with all profile fields');
const createRes = await getJson(baseUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!createRes.response.ok) {
  console.error('Create failed', createRes.response.status, createRes.data);
  process.exit(1);
}

const created = createRes.data;
console.log('   Created id:', created.id);

const checks = [
  ['registrationName', payload.registrationName],
  ['companyId', payload.companyId],
  ['csrCommonName', payload.csrCommonName],
  ['ccsidOtp', payload.ccsidOtp],
  ['pcsidSecret', payload.pcsidSecret],
  ['storeStatus', payload.storeStatus],
  ['status', payload.status],
];

for (const [key, expected] of checks) {
  if (created[key] !== expected) {
    console.error(`Mismatch on ${key}: expected ${expected}, got ${created[key]}`);
    process.exit(1);
  }
}

console.log('2. Fetch entity by id');
const getRes = await getJson(`${baseUrl}/${created.id}`);
if (!getRes.response.ok || getRes.data.registrationName !== payload.registrationName) {
  console.error('Fetch failed or missing profile fields', getRes.data);
  process.exit(1);
}

console.log('3. Cleanup');
await fetch(`${baseUrl}/${created.id}`, { method: 'DELETE' });

console.log('\nEntity create-with-all-fields test passed.');
