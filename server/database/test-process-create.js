const baseUrl = 'http://localhost:3009/api/org/processes';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

console.log('1. Create process draft with title, tags, sections, and questions');
const createRes = await getJson(`${baseUrl}/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Daily Opening Checklist',
    description: 'Opening tasks for store teams',
    processTags: ['Operations'],
    organizationId: 'default-org',
    sections: [
      {
        title: 'Opening Tasks',
        description: 'Morning checklist',
        displayOrder: 0,
        questions: [
          {
            questionText: 'Store front clean?',
            questionType: 'single-answer',
            options: {
              options: [
                { label: 'Compliant', score: 100 },
                { label: 'Non-Compliant', score: 0 },
              ],
            },
            isRequired: true,
            displayOrder: 0,
          },
          {
            questionText: 'Cash float amount',
            questionType: 'short-answer',
            options: { validationType: 'number' },
            isRequired: false,
            displayOrder: 1,
          },
        ],
      },
    ],
  }),
});

if (!createRes.response.ok) {
  console.error('Create draft failed', createRes.response.status, createRes.data);
  process.exit(1);
}

const createdProcess = createRes.data;
console.log('   Created:', createdProcess.id, createdProcess.title, 'status:', createdProcess.status);

if (createdProcess.status !== 'draft') {
  console.error('Expected draft status');
  process.exit(1);
}

if (!createdProcess.sections?.length || createdProcess.sections[0].questions?.length !== 2) {
  console.error('Sections/questions not saved correctly', createdProcess.sections);
  process.exit(1);
}

console.log('2. Update draft');
const updateRes = await getJson(`${baseUrl}/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: createdProcess.id,
    title: 'Daily Opening Checklist v2',
    description: 'Updated opening tasks',
    processTags: ['Operations', 'Quality Control'],
    organizationId: 'default-org',
    sections: [
      {
        title: 'Opening Tasks',
        displayOrder: 0,
        questions: [
          {
            questionText: 'Lights turned on?',
            questionType: 'single-answer',
            options: { options: [{ label: 'Yes' }, { label: 'No' }] },
            displayOrder: 0,
          },
        ],
      },
      {
        title: 'Safety Checks',
        displayOrder: 1,
        questions: [
          {
            questionText: 'Fire exit clear?',
            questionType: 'long-answer',
            displayOrder: 0,
          },
        ],
      },
    ],
  }),
});

if (!updateRes.response.ok) {
  console.error('Update draft failed', updateRes.response.status, updateRes.data);
  process.exit(1);
}

console.log('   Updated sections:', updateRes.data.sections?.length);

console.log('3. List processes');
const listRes = await getJson(`${baseUrl}?organizationId=default-org`);
const found = Array.isArray(listRes.data)
  ? listRes.data.find((item) => item.id === createdProcess.id)
  : null;
if (!found || found.status !== 'draft') {
  console.error('Draft not found in list');
  process.exit(1);
}

console.log('4. Cleanup');
await fetch(`${baseUrl}/${createdProcess.id}`, { method: 'DELETE' });

console.log('\nProcess draft creation test passed.');
