/**
 * Test course completion reminder notifications end-to-end.
 * Run: node server/database/test-course-completion-reminders.cjs
 */
const NOTIF = process.env.NOTIFICATION_API || 'http://localhost:3009/api/notification';
const ORG = process.env.ORG_API || 'http://localhost:3009/api/org';
const USER_ID = process.env.TEST_USER_ID || 'admin-user';
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

async function main() {
  console.log('Course completion reminder test');

  const sync = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        { notificationType: '_global', inAppEnabled: true, emailEnabled: true },
        {
          notificationType: 'course_completion_reminder',
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
  console.log('OK  preferences synced');

  const dueSoon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const courseRes = await request(`${ORG}/courses`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Reminder Test Course ${Date.now()}`,
      organizationId: ORG_ID,
      status: 'published',
      expiresAt: dueSoon,
      assigneeIds: [],
    }),
  });
  if (!courseRes.ok || !courseRes.body?.id) {
    console.error('FAIL create course', courseRes.status, courseRes.body);
    process.exit(1);
  }
  const courseId = courseRes.body.id;
  console.log('OK  course created', courseId);

  const progressRes = await request(`${ORG}/courses/progress`, {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      userId: USER_ID,
      organizationId: ORG_ID,
      status: 'in_progress',
      progress: 35,
      startedAt: new Date().toISOString(),
    }),
  });
  if (!progressRes.ok || !progressRes.body?.id) {
    console.error('FAIL create progress', progressRes.status, progressRes.body);
    process.exit(1);
  }
  console.log('OK  course progress created', progressRes.body.id);

  await new Promise((r) => setTimeout(r, 1500));

  const list1 = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const afterProgress = (list1.body || []).filter((n) => n.type === 'course_completion_reminder');
  if (!afterProgress.length) {
    console.log('WARN no reminder on progress create (org-service may need restart); trying batch run');
  } else {
    console.log('OK  reminder after progress create');
  }

  const run = await request(`${ORG}/courses/reminders/run?organizationId=${ORG_ID}`, {
    method: 'POST',
  });
  if (!run.ok) {
    console.error('FAIL batch reminders', run.status, run.body);
    process.exit(1);
  }
  console.log('OK  batch reminders', run.body);

  await new Promise((r) => setTimeout(r, 1000));

  const list2 = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  const reminders = (list2.body || []).filter(
    (n) => n.type === 'course_completion_reminder' && String(n.data?.courseId || n.data?.itemId) === courseId,
  );
  if (!reminders.length) {
    console.error('FAIL no course_completion_reminder for course', courseId);
    process.exit(1);
  }
  console.log('OK  course_completion_reminder delivered', reminders[0].id);

  const assignRes = await request(`${ORG}/courses/${courseId}/assignment`, {
    method: 'PUT',
    body: JSON.stringify({ assigneeIds: [USER_ID] }),
  });
  if (!assignRes.ok) {
    console.error('FAIL assign course', assignRes.status, assignRes.body);
    process.exit(1);
  }
  console.log('OK  course assignment endpoint');

  const blocked = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        { notificationType: '_global', inAppEnabled: true },
        { notificationType: 'course_completion_reminder', inAppEnabled: false, emailEnabled: false },
      ],
    }),
  });
  if (!blocked.ok) {
    console.error('FAIL disable reminder pref');
    process.exit(1);
  }

  const blockedCreate = await request(`${NOTIF}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      type: 'course_completion_reminder',
      title: 'Should block',
      content: 'blocked',
      deliveryMethod: 'IN_APP',
    }),
  });
  if (blockedCreate.body?.id) {
    console.error('FAIL reminder should be blocked by preferences');
    process.exit(1);
  }
  console.log('OK  preferences block delivery');

  console.log('\nAll course completion reminder tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
