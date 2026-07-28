const ORG_API = 'http://localhost:3009/api/org';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function main() {
console.log('1. Save assessment draft');
const draftRes = await getJson(`${ORG_API}/assessments/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: `Safety Assessment ${Date.now()}`,
    description: 'Monthly safety knowledge check',
    organizationId: 'default-org',
    passingScore: 30,
    duration: 60,
    maxAttempts: 1,
    visible: true,
    showResult: true,
    sections: [
      {
        title: 'Section 1',
        displayOrder: 0,
        questions: [
          {
            questionText: 'Wear PPE at all times?',
            questionType: 'single-answer',
            isRequired: true,
            displayOrder: 0,
            options: { choices: ['Yes', 'No'] },
          },
        ],
      },
    ],
  }),
});

if (!draftRes.response.ok) {
  console.error('Draft save failed', draftRes.data);
  process.exit(1);
}

const assessmentId = draftRes.data.id;
console.log('   Created draft:', assessmentId, draftRes.data.title);

console.log('2. Assign by store');
const entitiesRes = await getJson(`${ORG_API}/entities?organizationId=default-org`);
const storeId = (Array.isArray(entitiesRes.data) ? entitiesRes.data : [])[0]?.id;
if (!storeId) {
  console.error('No store available');
  process.exit(1);
}

const assignRes = await getJson(`${ORG_API}/assessments/${assessmentId}/assignment`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storeIds: [storeId] }),
});
if (!assignRes.response.ok) {
  console.error('Assign failed', assignRes.data);
  process.exit(1);
}
console.log('   Assigned stores:', assignRes.data.storeIds?.length ?? 0);

console.log('3. Publish assessment');
const publishRes = await getJson(`${ORG_API}/assessments/${assessmentId}/publish`, {
  method: 'PUT',
});
if (!publishRes.response.ok) {
  console.error('Publish failed', publishRes.data);
  process.exit(1);
}
console.log('   Published:', publishRes.data.status);

console.log('4. List assessments');
const listRes = await getJson(`${ORG_API}/assessments?organizationId=default-org`);
console.log('   Count:', Array.isArray(listRes.data) ? listRes.data.length : 0);

await fetch(`${ORG_API}/assessments/${assessmentId}`, { method: 'DELETE' });
console.log('\nAssessment creation workflow test passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
