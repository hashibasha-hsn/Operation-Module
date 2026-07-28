/**
 * Test certificate issuance + learning assignment notifications.
 * Run: node server/database/test-certificate-notifications.cjs
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
  console.log('Certificate & learning notification test');

  const health = await request(`${NOTIF}/health`);
  if (!health.ok) {
    console.error('FAIL notification health', health.status);
    process.exit(1);
  }
  console.log('OK  notification service');

  const sync = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        {
          notificationType: '_global',
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          emailFrequency: 'instant',
        },
        {
          notificationType: 'certificate_issued',
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
        },
        {
          notificationType: 'learning_assignment',
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
        },
      ],
    }),
  });
  if (!sync.ok) {
    console.error('FAIL sync prefs', sync.status, sync.body);
    process.exit(1);
  }
  console.log('OK  learning notification preferences');

  const cert = await request(`${NOTIF}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      type: 'certificate_issued',
      title: 'Certificate issued',
      content: 'Your certificate for "Safety Assessment" is ready.',
      data: {
        itemType: 'assessment',
        itemId: 'test-assessment-id',
        link: '/learning/assessment/test-assessment-id',
      },
      deliveryMethod: 'IN_APP',
      priority: 'NORMAL',
      status: 'PENDING',
    }),
  });
  if (!cert.ok || !cert.body?.id) {
    console.error('FAIL create certificate notification', cert.status, cert.body);
    process.exit(1);
  }
  console.log('OK  certificate_issued notification created', cert.body.id);

  const assign = await request(`${NOTIF}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      type: 'learning_assignment',
      title: 'New learning assignment',
      content: 'You have been assigned "Food Safety Course".',
      data: {
        itemType: 'course',
        itemId: 'test-course-id',
        link: '/learning/courses/test-course-id',
      },
      deliveryMethod: 'IN_APP',
      priority: 'NORMAL',
      status: 'PENDING',
    }),
  });
  if (!assign.ok || !assign.body?.id) {
    console.error('FAIL create learning assignment notification', assign.status, assign.body);
    process.exit(1);
  }
  console.log('OK  learning_assignment notification created', assign.body.id);

  const list = await request(`${NOTIF}/notifications/user/${USER_ID}`);
  if (!list.ok || !Array.isArray(list.body)) {
    console.error('FAIL list notifications', list.status, list.body);
    process.exit(1);
  }
  const hasCert = list.body.some((n) => n.type === 'certificate_issued');
  const hasAssign = list.body.some((n) => n.type === 'learning_assignment');
  if (!hasCert || !hasAssign) {
    console.error('FAIL expected notification types missing', list.body.map((n) => n.type));
    process.exit(1);
  }
  console.log('OK  notifications listed for user');

  const blocked = await request(`${NOTIF}/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify({
      preferences: [
        { notificationType: '_global', inAppEnabled: true, emailEnabled: true },
        { notificationType: 'certificate_issued', inAppEnabled: false, emailEnabled: false },
      ],
    }),
  });
  if (!blocked.ok) {
    console.error('FAIL disable certificate pref', blocked.status);
    process.exit(1);
  }

  const blockedCreate = await request(`${NOTIF}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      type: 'certificate_issued',
      title: 'Should be blocked',
      content: 'Blocked certificate',
      deliveryMethod: 'IN_APP',
      priority: 'NORMAL',
      status: 'PENDING',
    }),
  });
  const wasBlocked = !blockedCreate.body?.id;
  if (!wasBlocked) {
    console.error('FAIL certificate notification should be blocked by preferences');
    process.exit(1);
  }
  console.log('OK  certificate delivery respects preferences');

  console.log('\nAll certificate & learning notification tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
