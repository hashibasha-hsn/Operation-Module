const base = 'http://localhost:3009/api/org/audits';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

const userRes = await getJson('http://localhost:3009/api/user/users?limit=1');
const userId = userRes.data?.users?.[0]?.userId;
const entitiesRes = await getJson('http://localhost:3009/api/org/entities?organizationId=default-org');
const storeId = (Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [])[0]?.id;

const createRes = await getJson(`${base}/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Brand Compliance Audit',
    description: 'Store audit test',
    organizationId: 'default-org',
    processTags: ['Operations'],
    passThreshold: 75,
    reviewLevels: 2,
    assigneeIds: userId ? [userId] : [],
    storeIds: storeId ? [storeId] : [],
    sections: [
      {
        title: 'Front of House',
        displayOrder: 0,
        questions: [
          {
            questionText: 'Is signage compliant?',
            questionType: 'single-answer',
            isRequired: true,
            isCritical: true,
            options: { options: [{ label: 'Yes', score: 100 }, { label: 'No', score: 0 }] },
          },
        ],
      },
    ],
  }),
});

if (!createRes.response.ok) {
  console.error('Draft failed', createRes.response.status, createRes.data);
  process.exit(1);
}

const auditId = createRes.data.id;
console.log('Draft created:', auditId, createRes.data.title);

const publishRes = await getJson(`${base}/${auditId}/publish`, { method: 'PUT' });
if (!publishRes.response.ok) {
  console.error('Publish failed', publishRes.data);
  process.exit(1);
}
console.log('Published:', publishRes.data.status);

const listRes = await getJson(`${base}?organizationId=default-org`);
console.log('Audits listed:', listRes.data?.length);

await fetch(`${base}/${auditId}`, { method: 'DELETE' });
console.log('Audit flow test passed.');
