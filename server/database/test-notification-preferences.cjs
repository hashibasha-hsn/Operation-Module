/**
 * Smoke test: notification preference type toggles + delivery enforcement.
 * Run: node server/database/test-notification-preferences.cjs
 */
const BASE = process.env.NOTIFICATION_API || 'http://localhost:3009/api/notification';
const USER_ID = process.env.TEST_USER_ID || 'admin-user';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
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

function pref(preferences, type) {
  return preferences.find((p) => p.notificationType === type);
}

async function main() {
  console.log('Notification preferences test');
  console.log('API:', BASE);
  console.log('User:', USER_ID);

  const health = await request('/health');
  if (!health.ok) {
    console.error('FAIL health', health.status, health.body);
    process.exit(1);
  }
  console.log('OK  health');

  const syncPayload = {
    preferences: [
      {
        notificationType: '_global',
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        emailFrequency: 'instant',
        smsUrgentOnly: true,
        pushDesktopEnabled: true,
        pushMobileEnabled: true,
        inAppSoundEnabled: true,
      },
      {
        notificationType: 'task_reminder',
        emailEnabled: false,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
      },
      {
        notificationType: 'deadline_alert',
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
        inAppEnabled: false,
      },
      {
        notificationType: 'mention',
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
      },
      {
        notificationType: 'weekly_digest',
        emailEnabled: false,
        pushEnabled: false,
        smsEnabled: false,
        inAppEnabled: false,
        emailFrequency: 'weekly',
      },
    ],
  };

  const sync = await request(`/notifications/preferences/${USER_ID}/sync`, {
    method: 'PUT',
    body: JSON.stringify(syncPayload),
  });
  if (!sync.ok) {
    console.error('FAIL sync', sync.status, sync.body);
    process.exit(1);
  }
  console.log('OK  sync preferences');

  const task = pref(sync.body, 'task_reminder');
  const deadline = pref(sync.body, 'deadline_alert');
  if (!task || task.emailEnabled !== false || task.inAppEnabled !== true) {
    console.error('FAIL task_reminder toggles', task);
    process.exit(1);
  }
  if (!deadline || deadline.inAppEnabled !== false || deadline.emailEnabled !== true) {
    console.error('FAIL deadline_alert toggles', deadline);
    process.exit(1);
  }
  console.log('OK  per-type toggles persisted');

  const cases = [
    {
      label: 'task in-app allowed',
      payload: {
        userId: USER_ID,
        type: 'task_reminder',
        title: 'Task',
        message: 'Reminder',
        deliveryMethod: 'IN_APP',
        priority: 'NORMAL',
      },
      expectCreated: true,
    },
    {
      label: 'task email blocked (type off)',
      payload: {
        userId: USER_ID,
        type: 'task_reminder',
        title: 'Task',
        message: 'Reminder',
        deliveryMethod: 'EMAIL',
        priority: 'NORMAL',
      },
      expectCreated: false,
    },
    {
      label: 'deadline in-app blocked (type off)',
      payload: {
        userId: USER_ID,
        type: 'deadline_alert',
        title: 'Deadline',
        message: 'Due soon',
        deliveryMethod: 'IN_APP',
        priority: 'NORMAL',
      },
      expectCreated: false,
    },
    {
      label: 'mention push allowed',
      payload: {
        userId: USER_ID,
        type: 'mention',
        title: 'Mention',
        message: 'You were mentioned',
        deliveryMethod: 'PUSH',
        priority: 'NORMAL',
      },
      expectCreated: true,
    },
  ];

  for (const testCase of cases) {
    const created = await request('/notifications', {
      method: 'POST',
      body: JSON.stringify(testCase.payload),
    });
    const wasCreated = created.status >= 200 && created.status < 300 && Boolean(created.body?.id);
    if (wasCreated !== testCase.expectCreated) {
      console.error(`FAIL ${testCase.label}`, created.status, created.body);
      process.exit(1);
    }
    console.log(`OK  ${testCase.label}`);
  }

  console.log('\nAll notification preference tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
