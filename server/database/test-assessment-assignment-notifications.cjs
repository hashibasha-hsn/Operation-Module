/**
 * Test assessment assignment notifications end-to-end.
 * Run: node server/database/test-assessment-assignment-notifications.cjs
 */
const NOTIF = process.env.NOTIFICATION_API || 'http://localhost:3009/api/notification';
const ORG = process.env.ORG_API || 'http://localhost:3009/api/org';
const USER = process.env.USER_API || 'http://localhost:3002';
const ORG_ID = process.env.TEST_ORG_ID || 'default-org';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

function countAssessmentAssignments(notifications, assessmentId) {
  return (notifications || []).filter(
    (n) =>
      n.type === 'learning_assignment' &&
      n.data?.itemType === 'assessment' &&
      String(n.data?.itemId) === String(assessmentId),
  ).length;
}

async function main() {
  console.log('Assessment assignment notification test');

  const usersRes = await request(`${USER}/users?limit=50`);
  if (!usersRes.ok || !usersRes.body?.users?.length) {
    console.error('FAIL fetch users', usersRes.status, usersRes.body);
    process.exit(1);
  }
  const targetUser = usersRes.body.users[0];
  const USER_ID = String(targetUser.userId || targetUser.id);
  const STORE_ID = String(targetUser.entityId || targetUser.storeId || '');
  if (!USER_ID) {
    console.error('FAIL no test user');
    process.exit(1);
  }
  console.log('OK  test user', USER_ID, 'store/entity', STORE_ID || '(none)');

  const sync = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        { notificationType: '_global', inAppEnabled: true, emailEnabled: true },
        {
          notificationType: 'learning_assignment',
          inAppEnabled: true,
          emailEnabled: true,
          pushEnabled: true,
        },
      ],
    }),
  });
  if (!sync.ok) {
    console.error('FAIL sync preferences', sync.status, sync.body);
    process.exit(1);
  }
  console.log('OK  learning_assignment preferences enabled');

  const stamp = Date.now();
  const draftRes = await request(`${ORG}/assessments/draft`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Assignment Notify Test ${stamp}`,
      organizationId: ORG_ID,
      passingScore: 70,
      duration: 30,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      sections: [
        {
          title: 'Section 1',
          questions: [
            {
              questionText: 'Sample question?',
              questionType: 'single_choice',
              options: { choices: [{ id: 'a', text: 'Yes' }] },
            },
          ],
        },
      ],
    }),
  });
  if (!draftRes.ok || !draftRes.body?.id) {
    console.error('FAIL create assessment draft', draftRes.status, draftRes.body);
    process.exit(1);
  }
  const assessmentId = draftRes.body.id;
  console.log('OK  assessment draft created', assessmentId);

  const listBefore = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const beforeCount = countAssessmentAssignments(listBefore.body, assessmentId);

  const assignByStore = STORE_ID
    ? await request(`${ORG}/assessments/${assessmentId}/assignment`, {
        method: 'PUT',
        body: JSON.stringify({
          assigneeIds: [],
          storeIds: [STORE_ID],
          assigneeProfiles: { assignBy: 'store', profileIds: [], designationNames: [] },
        }),
      })
    : null;

  const assignByUser = await request(`${ORG}/assessments/${assessmentId}/assignment`, {
    method: 'PUT',
    body: JSON.stringify({
      assigneeIds: [USER_ID],
      storeIds: STORE_ID ? [STORE_ID] : [],
      assigneeProfiles: { assignBy: 'store', profileIds: [], designationNames: [] },
    }),
  });
  if (!assignByUser.ok) {
    console.error('FAIL assign assessment', assignByUser.status, assignByUser.body);
    process.exit(1);
  }
  console.log('OK  assessment assigned', assignByStore ? 'store + user' : 'user only');

  await new Promise((r) => setTimeout(r, 1500));

  const listAfterAssign = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const afterAssignCount = countAssessmentAssignments(listAfterAssign.body, assessmentId);
  if (afterAssignCount <= beforeCount) {
    console.error(
      'FAIL expected learning_assignment after assign',
      { beforeCount, afterAssignCount, assessmentId },
    );
    process.exit(1);
  }
  console.log('OK  learning_assignment delivered on assign', afterAssignCount - beforeCount);

  const reassigned = await request(`${ORG}/assessments/${assessmentId}/assignment`, {
    method: 'PUT',
    body: JSON.stringify({
      assigneeIds: [USER_ID],
      storeIds: STORE_ID ? [STORE_ID] : [],
      assigneeProfiles: { assignBy: 'store', profileIds: [], designationNames: [] },
    }),
  });
  if (!reassigned.ok) {
    console.error('FAIL reassign assessment', reassigned.status, reassigned.body);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 1000));

  const listAfterReassign = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const afterReassignCount = countAssessmentAssignments(listAfterReassign.body, assessmentId);
  if (afterReassignCount !== afterAssignCount) {
    console.error('FAIL duplicate notification on reassign', {
      afterAssignCount,
      afterReassignCount,
    });
    process.exit(1);
  }
  console.log('OK  no duplicate notification on reassign');

  const publishRes = await request(`${ORG}/assessments/${assessmentId}/publish`, {
    method: 'PUT',
  });
  if (!publishRes.ok) {
    console.error('FAIL publish assessment', publishRes.status, publishRes.body);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 1000));

  const listAfterPublish = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const afterPublishCount = countAssessmentAssignments(listAfterPublish.body, assessmentId);
  if (afterPublishCount !== afterAssignCount) {
    console.error('FAIL duplicate notification on publish', {
      afterAssignCount,
      afterPublishCount,
    });
    process.exit(1);
  }
  console.log('OK  no duplicate notification on publish');

  const sample = (listAfterPublish.body || []).find(
    (n) =>
      n.type === 'learning_assignment' &&
      String(n.data?.itemId) === String(assessmentId),
  );
  if (!sample?.title?.toLowerCase().includes('assessment')) {
    console.error('FAIL notification title/content', sample);
    process.exit(1);
  }
  if (sample.data?.itemType !== 'assessment' || !sample.data?.link) {
    console.error('FAIL notification data payload', sample?.data);
    process.exit(1);
  }
  console.log('OK  notification payload', sample.title);

  const blocked = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        { notificationType: '_global', inAppEnabled: true },
        { notificationType: 'learning_assignment', inAppEnabled: false, emailEnabled: false },
      ],
    }),
  });
  if (!blocked.ok) {
    console.error('FAIL disable learning_assignment pref');
    process.exit(1);
  }

  const draft2 = await request(`${ORG}/assessments/draft`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Blocked Assignment Test ${stamp}`,
      organizationId: ORG_ID,
      sections: [{ title: 'S1', questions: [{ questionText: 'Q?', questionType: 'text' }] }],
    }),
  });
  const blockedId = draft2.body?.id;
  await request(`${ORG}/assessments/${blockedId}/assignment`, {
    method: 'PUT',
    body: JSON.stringify({ assigneeIds: [USER_ID], storeIds: [] }),
  });
  await new Promise((r) => setTimeout(r, 800));

  const blockedCreate = await request(`${NOTIF}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      type: 'learning_assignment',
      title: 'Should be blocked',
      content: 'blocked',
      deliveryMethod: 'IN_APP',
    }),
  });
  if (blockedCreate.body?.id) {
    console.error('FAIL learning_assignment should be blocked by preferences');
    process.exit(1);
  }
  console.log('OK  preferences block delivery');

  console.log('\nAll assessment assignment notification tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
