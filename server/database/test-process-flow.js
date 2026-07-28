const baseUrl = 'http://localhost:3009/api/org/processes';
const userUrl = 'http://localhost:3009/api/user/users?limit=5';
const entitiesUrl = 'http://localhost:3009/api/org/entities?organizationId=default-org';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

const usersRes = await getJson(userUrl);
const userId = usersRes.data?.users?.[0]?.userId ?? usersRes.data?.users?.[0]?.id;
const entitiesRes = await getJson(entitiesUrl);
const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
const storeId = entities[0]?.id;

if (!userId) {
  console.error('No users available — seed users first');
  process.exit(1);
}
if (!storeId) {
  console.error('No entities available — create an entity first');
  process.exit(1);
}

const questionTypes = [
  { questionText: 'Compliance check', questionType: 'single-answer', options: { options: [{ label: 'Compliant', score: 100 }, { label: 'Non-Compliant', score: 0 }], markNA: true } },
  { questionText: 'Select all issues', questionType: 'multiple-answers', options: { marks: 5, options: [{ label: 'Clean', score: 100 }] } },
  { questionText: 'Staff count', questionType: 'short-answer', options: { validationType: 'number' } },
  { questionText: 'Upload receipt', questionType: 'file-upload', options: { answerAttachment: true } },
  { questionText: 'Describe issue', questionType: 'long-answer', options: { allowComment: true } },
  { questionText: 'Shift', questionType: 'dropdown', options: { options: [{ label: 'Morning' }, { label: 'Evening' }] } },
  { questionText: 'Category tag', questionType: 'adv-dropdown', options: { selectedTag: 'product-category' } },
  { questionText: 'Score item', questionType: 'scoring-dropdown', options: { options: [{ label: 'Good', score: 100 }] } },
  { questionText: 'Grid check', questionType: 'grid', options: { columns: ['A', 'B'], rows: ['Row 1'] } },
  { questionText: 'Calc grid', questionType: 'calculation-grid', options: { columns: ['Qty'], rows: ['Item 1'], dataType: 'number' } },
  { questionText: 'Dynamic grid', questionType: 'dynamic-grid', options: { columns: ['Value'] } },
  { questionText: 'Inspection date', questionType: 'date', options: { timestamp: true } },
  { questionText: 'Opening time', questionType: 'time', options: {} },
];

console.log('1. Create draft with all question types + properties');
const createRes = await getJson(`${baseUrl}/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Full Flow Test Process',
    description: 'End-to-end process creation test',
    processTags: ['Operations'],
    organizationId: 'default-org',
    properties: {
      occurrence: 'recurring',
      periodicityType: 'daily',
      startTime: '09:00',
      endTime: '17:00',
      emailAlerts: true,
      processPriority: '2',
    },
    frequency: 'daily',
    frequencyConfig: { startTime: '09:00', endTime: '17:00' },
    reminderConfig: { emailAlerts: true },
    sections: [
      {
        title: 'All Question Types',
        displayOrder: 0,
        questions: questionTypes.map((q, index) => ({ ...q, isRequired: index === 0, displayOrder: index })),
      },
    ],
  }),
});

if (!createRes.response.ok) {
  console.error('Create failed', createRes.response.status, createRes.data);
  process.exit(1);
}

const processId = createRes.data.id;
console.log('   Created draft:', processId, 'questions:', createRes.data.sections?.[0]?.questions?.length);

console.log('2. Assign to user and store');
const assignRes = await getJson(`${baseUrl}/${processId}/assignment`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assigneeIds: [userId], storeIds: [storeId] }),
});
if (!assignRes.response.ok) {
  console.error('Assign failed', assignRes.response.status, assignRes.data);
  process.exit(1);
}
console.log('   Assigned users:', assignRes.data.assigneeIds?.length, 'stores:', assignRes.data.storeIds?.length);

console.log('3. Publish process');
const publishRes = await getJson(`${baseUrl}/${processId}/publish`, { method: 'PUT' });
if (!publishRes.response.ok) {
  console.error('Publish failed', publishRes.response.status, publishRes.data);
  process.exit(1);
}
if (publishRes.data.status !== 'published') {
  console.error('Expected published status', publishRes.data.status);
  process.exit(1);
}
console.log('   Published:', publishRes.data.title);

console.log('4. Verify in process list');
const listRes = await getJson(`${baseUrl}?organizationId=default-org`);
const published = Array.isArray(listRes.data)
  ? listRes.data.filter((p) => p.status === 'published')
  : [];
const found = published.find((p) => p.id === processId);
if (!found) {
  console.error('Published process not found in list');
  process.exit(1);
}
console.log('   Listed published processes:', published.length);
console.log('   Found:', found.title, '| stores:', found.storeIds?.length, '| users:', found.assigneeIds?.length);

console.log('5. Cleanup');
await fetch(`${baseUrl}/${processId}`, { method: 'DELETE' });

console.log('\nFull process creation + assignment + publish flow test passed.');
