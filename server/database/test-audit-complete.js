/**
 * Full audit wizard + task submission test (mirrors UI flow).
 * Title -> Build -> Properties -> Assign -> Publish -> Start -> Save -> Submit
 */
const ORG = 'http://localhost:3009/api/org';

async function json(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  let userId = process.env.TEST_USER_ID;
  let storeId = process.env.TEST_STORE_ID;

  if (!userId) {
    const usersRes = await json('http://localhost:3009/api/user/users?limit=5');
    userId = usersRes.data?.users?.[0]?.userId;
  }
  if (!storeId) {
    const entitiesRes = await json(`${ORG}/entities?organizationId=default-org`);
    const entities = Array.isArray(entitiesRes.data)
      ? entitiesRes.data
      : entitiesRes.data?.value || [];
    storeId = entities[0]?.id;
  }

  // Fallback IDs used in local dev seed data
  userId = userId || 'dbd92bf6-7bc6-4e61-870e-723f6a6dca40';
  storeId = storeId || '2feaf604-9b0c-4317-93b1-6d7608218bf6';

  console.log('Using userId:', userId, 'storeId:', storeId);

  console.log('Step 1: Title — save audit draft with title');
  const titleRes = await json(`${ORG}/audits/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Complete UI Flow Audit Test',
      description: 'End-to-end audit wizard test',
      organizationId: 'default-org',
      processTags: ['Operations'],
      passThreshold: 75,
      reviewLevels: 2,
      sections: [
        {
          title: 'Section 1',
          displayOrder: 0,
          questions: [],
        },
      ],
    }),
  });
  assert(titleRes.response.ok, `Title save failed: ${JSON.stringify(titleRes.data)}`);
  assert(titleRes.data.id, 'Draft id missing after title save');
  assert(titleRes.data.title === 'Complete UI Flow Audit Test', 'Title not persisted');
  const auditId = titleRes.data.id;
  console.log('  OK — draft id:', auditId, 'title:', titleRes.data.title);

  console.log('Step 2: Build — add questions to draft');
  const buildRes = await json(`${ORG}/audits/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: auditId,
      title: 'Complete UI Flow Audit Test',
      description: 'End-to-end audit wizard test',
      organizationId: 'default-org',
      processTags: ['Operations'],
      passThreshold: 75,
      reviewLevels: 2,
      sections: [
        {
          title: 'Store Standards',
          displayOrder: 0,
          questions: [
            {
              questionText: 'Is the entrance clean?',
              questionType: 'single-answer',
              isRequired: true,
              isCritical: true,
              options: { options: [{ label: 'Yes', score: 100 }, { label: 'No', score: 0 }] },
            },
            {
              questionText: 'Staff uniform compliance',
              questionType: 'single-answer',
              isRequired: true,
              options: { options: [{ label: 'Yes' }, { label: 'No' }] },
            },
          ],
        },
      ],
    }),
  });
  assert(buildRes.response.ok, `Build save failed: ${JSON.stringify(buildRes.data)}`);
  assert(buildRes.data.sections?.[0]?.questions?.length === 2, 'Questions not saved');
  console.log('  OK — questions:', buildRes.data.sections[0].questions.length);

  console.log('Step 3: Properties — update pass threshold');
  const propsRes = await json(`${ORG}/audits/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: auditId,
      title: 'Complete UI Flow Audit Test',
      description: 'End-to-end audit wizard test',
      organizationId: 'default-org',
      passThreshold: 80,
      reviewLevels: 2,
      frequency: 'daily',
      sections: buildRes.data.sections.map((s) => ({
        title: s.title,
        displayOrder: s.displayOrder,
        questions: (s.questions ?? []).map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          isCritical: q.isCritical,
          options: q.options,
        })),
      })),
    }),
  });
  assert(propsRes.response.ok, `Properties save failed: ${JSON.stringify(propsRes.data)}`);
  assert(Number(propsRes.data.passThreshold) === 80, 'Pass threshold not saved');
  console.log('  OK — passThreshold:', propsRes.data.passThreshold);

  console.log('Step 4: Assign — users and stores');
  const assignRes = await json(`${ORG}/audits/${auditId}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assigneeIds: [userId],
      storeIds: [storeId],
    }),
  });
  assert(assignRes.response.ok, `Assign failed: ${JSON.stringify(assignRes.data)}`);
  console.log('  OK — assigned user + store');

  console.log('Step 5: Publish');
  const publishRes = await json(`${ORG}/audits/${auditId}/publish`, { method: 'PUT' });
  assert(publishRes.response.ok, `Publish failed: ${JSON.stringify(publishRes.data)}`);
  assert(publishRes.data.status === 'published', 'Status should be published');
  console.log('  OK — status:', publishRes.data.status);

  console.log('Step 6: Assigned list for user');
  const assignedRes = await json(
    `${ORG}/audits/assigned/list?userId=${userId}&storeId=${storeId}&organizationId=default-org`,
  );
  assert(assignedRes.response.ok, 'Assigned list failed');
  const assigned = assignedRes.data.find((a) => a.id === auditId);
  assert(assigned, 'Published audit not in assigned list');
  console.log('  OK — found in assigned list:', assigned.title);

  console.log('Step 7: Start submission (Tasks)');
  const startRes = await json(`${ORG}/submissions/audit/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auditId, userId, storeId, organizationId: 'default-org' }),
  });
  assert(startRes.response.ok, `Start failed: ${JSON.stringify(startRes.data)}`);
  const submissionId = startRes.data.id;
  console.log('  OK — submission:', submissionId);

  console.log('Step 8: Save draft answers');
  const saveRes = await json(`${ORG}/submissions/audit/${submissionId}/save`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      answers: { responses: { q1: 'Yes' }, submissionDate: new Date().toISOString().slice(0, 10) },
    }),
  });
  assert(saveRes.response.ok, `Save submission failed: ${JSON.stringify(saveRes.data)}`);
  console.log('  OK — draft saved');

  console.log('Step 9: Submit audit');
  const submitRes = await json(`${ORG}/submissions/audit/${submissionId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      answers: { responses: { q1: 'Yes', q2: 'Yes' }, submissionDate: new Date().toISOString().slice(0, 10) },
    }),
  });
  assert(submitRes.response.ok, `Submit failed: ${JSON.stringify(submitRes.data)}`);
  assert(submitRes.data.status === 'completed', 'Submission should be completed');
  console.log('  OK — status:', submitRes.data.status);

  await fetch(`${ORG}/audits/${auditId}`, { method: 'DELETE' });
  console.log('\nAll audit wizard + task steps passed.');
}

main().catch((error) => {
  console.error('\nTEST FAILED:', error.message);
  process.exit(1);
});
