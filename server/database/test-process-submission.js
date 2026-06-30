const orgBase = 'http://localhost:3009/api/org';
const userUrl = 'http://localhost:3009/api/user/users?limit=5';

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

const usersRes = await getJson(userUrl);
const userId = usersRes.data?.users?.[0]?.userId ?? usersRes.data?.users?.[0]?.id;

const entitiesRes = await getJson(`${orgBase}/entities?organizationId=default-org`);
const entities = Array.isArray(entitiesRes.data) ? entitiesRes.data : entitiesRes.data?.value || [];
const storeId = entities[0]?.id;

if (!userId || !storeId) {
  console.error('Need at least one user and entity');
  process.exit(1);
}

console.log('1. Find or create published process');
let publishedRes = await getJson(`${orgBase}/processes/published/list?organizationId=default-org`);
let publishedProcess = publishedRes.data?.[0];

if (!publishedProcess) {
  const createRes = await getJson(`${orgBase}/processes/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Submission Flow Test',
      description: 'Draft/submit test',
      organizationId: 'default-org',
      sections: [
        {
          title: 'Section 1',
          displayOrder: 0,
          questions: [
            {
              questionText: 'Is store open?',
              questionType: 'short-answer',
              isRequired: true,
              displayOrder: 0,
            },
          ],
        },
      ],
    }),
  });
  if (!createRes.response.ok) {
    console.error('Create draft failed', createRes.data);
    process.exit(1);
  }
  const processId = createRes.data.id;
  await getJson(`${orgBase}/processes/${processId}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeIds: [userId], storeIds: [storeId] }),
  });
  const publishRes = await getJson(`${orgBase}/processes/${processId}/publish`, { method: 'PUT' });
  if (!publishRes.response.ok) {
    console.error('Publish failed', publishRes.data);
    process.exit(1);
  }
  publishedProcess = publishRes.data;
}

console.log('   Using process:', publishedProcess.title, publishedProcess.id);

console.log('2. Assign process to user via assign-user API');
const assignRes = await getJson(`${orgBase}/processes/assign-user`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, processIds: [publishedProcess.id] }),
});
if (!assignRes.response.ok) {
  console.error('assign-user failed', assignRes.data);
  process.exit(1);
}

console.log('3. Verify assigned list');
const assignedRes = await getJson(
  `${orgBase}/processes/assigned/list?userId=${userId}&organizationId=default-org&storeId=${storeId}`,
);
const assigned = assignedRes.data?.find((item) => item.id === publishedProcess.id);
if (!assigned) {
  console.error('Process not in assigned list', assignedRes.data);
  process.exit(1);
}
console.log('   Assigned:', assigned.title);

console.log('4. Start submission');
const startRes = await getJson(`${orgBase}/submissions/process/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    processId: publishedProcess.id,
    userId,
    storeId,
    organizationId: 'default-org',
  }),
});
if (!startRes.response.ok) {
  console.error('Start failed', startRes.data);
  process.exit(1);
}
const submissionId = startRes.data.id;
console.log('   Draft id:', submissionId);

console.log('5. Save draft');
const questionId = publishedProcess.sections?.[0]?.questions?.[0]?.id ?? 'q1';
const saveRes = await getJson(`${orgBase}/submissions/process/${submissionId}/save`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    answers: { responses: { [questionId]: 'Yes' }, submissionDate: new Date().toISOString().slice(0, 10) },
  }),
});
if (!saveRes.response.ok) {
  console.error('Save failed', saveRes.data);
  process.exit(1);
}
console.log('   Saved draft status:', saveRes.data.status);

console.log('6. Submit process');
const submitRes = await getJson(`${orgBase}/submissions/process/${submissionId}/submit`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    answers: { responses: { [questionId]: 'Yes' }, submissionDate: new Date().toISOString().slice(0, 10) },
  }),
});
if (!submitRes.response.ok) {
  console.error('Submit failed', submitRes.data);
  process.exit(1);
}
if (submitRes.data.status !== 'completed') {
  console.error('Expected completed status', submitRes.data.status);
  process.exit(1);
}
console.log('   Submitted:', submitRes.data.status);

console.log('7. Verify user submissions');
const userSubsRes = await getJson(
  `${orgBase}/submissions/process/user?userId=${userId}&organizationId=default-org`,
);
const completed = userSubsRes.data?.find((item) => item.id === submissionId);
if (!completed || completed.status !== 'completed') {
  console.error('Completed submission not found');
  process.exit(1);
}

console.log('\nProcess submission flow test passed.');
