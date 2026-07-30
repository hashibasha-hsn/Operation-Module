export const NOTIFICATION_API =
  import.meta.env.VITE_NOTIFICATION_API || '/api/notification';

export type EmailFrequency = 'instant' | 'daily' | 'weekly' | 'urgent_only' | 'off';

export const GLOBAL_PREFERENCE_TYPE = '_global';
export const TASK_REMINDER_TYPE = 'task_reminder';
export const DEADLINE_ALERT_TYPE = 'deadline_alert';
export const MENTION_TYPE = 'mention';
export const WEEKLY_DIGEST_TYPE = 'weekly_digest';
export const CERTIFICATE_ISSUED_TYPE = 'certificate_issued';
export const LEARNING_ASSIGNMENT_TYPE = 'learning_assignment';
export const COURSE_COMPLETION_REMINDER_TYPE = 'course_completion_reminder';
export const PROCESS_ASSIGNED_TYPE = 'process_assigned';
export const AUDIT_ASSIGNED_TYPE = 'audit_assigned';
export const ACTION_POINT_ASSIGNED_TYPE = 'action_point_assigned';
export const TICKET_ASSIGNED_TYPE = 'ticket_assigned';

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  content?: string;
  data?: Record<string, unknown>;
  priority?: string;
  status?: string;
  deliveryMethod?: string;
  createdAt?: string;
  readAt?: string | null;
};

export type NotificationPreference = {
  id?: string;
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  emailFrequency: EmailFrequency;
  smsUrgentOnly: boolean;
  pushDesktopEnabled: boolean;
  pushMobileEnabled: boolean;
  inAppSoundEnabled: boolean;
};

export type NotificationSettingsForm = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  emailFrequency: EmailFrequency;
  smsUrgentOnly: boolean;
  pushDesktopEnabled: boolean;
  pushMobileEnabled: boolean;
  inAppSoundEnabled: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
  weeklyDigest: boolean;
  mentions: boolean;
  emailTaskReminders: boolean;
  emailDeadlineAlerts: boolean;
  emailMentions: boolean;
  pushTaskReminders: boolean;
  pushDeadlineAlerts: boolean;
  pushMentions: boolean;
  certificateIssued: boolean;
  emailCertificateIssued: boolean;
  pushCertificateIssued: boolean;
  learningAssignments: boolean;
  emailLearningAssignments: boolean;
  pushLearningAssignments: boolean;
  courseCompletionReminders: boolean;
  emailCourseCompletionReminders: boolean;
  pushCourseCompletionReminders: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsForm = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  emailFrequency: 'instant',
  smsUrgentOnly: true,
  pushDesktopEnabled: true,
  pushMobileEnabled: true,
  inAppSoundEnabled: true,
  taskReminders: true,
  deadlineAlerts: true,
  weeklyDigest: false,
  mentions: true,
  emailTaskReminders: true,
  emailDeadlineAlerts: true,
  emailMentions: true,
  pushTaskReminders: true,
  pushDeadlineAlerts: true,
  pushMentions: true,
  certificateIssued: true,
  emailCertificateIssued: true,
  pushCertificateIssued: true,
  learningAssignments: true,
  emailLearningAssignments: true,
  pushLearningAssignments: true,
  courseCompletionReminders: true,
  emailCourseCompletionReminders: true,
  pushCourseCompletionReminders: true,
};

function pref(
  userId: string,
  notificationType: string,
  values: Partial<NotificationPreference>,
): NotificationPreference {
  return {
    userId,
    notificationType,
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    emailFrequency: 'instant',
    smsUrgentOnly: true,
    pushDesktopEnabled: true,
    pushMobileEnabled: true,
    inAppSoundEnabled: true,
    ...values,
  };
}

export function preferencesToForm(
  preferences: NotificationPreference[],
): NotificationSettingsForm {
  const byType = new Map(preferences.map((item) => [item.notificationType, item]));
  const globalPref = byType.get(GLOBAL_PREFERENCE_TYPE);
  const taskPref = byType.get(TASK_REMINDER_TYPE);
  const deadlinePref = byType.get(DEADLINE_ALERT_TYPE);
  const mentionPref = byType.get(MENTION_TYPE);
  const weeklyPref = byType.get(WEEKLY_DIGEST_TYPE);
  const certificatePref = byType.get(CERTIFICATE_ISSUED_TYPE);
  const learningPref = byType.get(LEARNING_ASSIGNMENT_TYPE);
  const courseReminderPref = byType.get(COURSE_COMPLETION_REMINDER_TYPE);

  return {
    emailEnabled: globalPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailEnabled,
    pushEnabled: globalPref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushEnabled,
    smsEnabled: globalPref?.smsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.smsEnabled,
    inAppEnabled: globalPref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.inAppEnabled,
    emailFrequency: globalPref?.emailFrequency ?? DEFAULT_NOTIFICATION_SETTINGS.emailFrequency,
    smsUrgentOnly: globalPref?.smsUrgentOnly ?? DEFAULT_NOTIFICATION_SETTINGS.smsUrgentOnly,
    pushDesktopEnabled:
      globalPref?.pushDesktopEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushDesktopEnabled,
    pushMobileEnabled:
      globalPref?.pushMobileEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushMobileEnabled,
    inAppSoundEnabled:
      globalPref?.inAppSoundEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.inAppSoundEnabled,
    taskReminders: taskPref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.taskReminders,
    deadlineAlerts: deadlinePref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.deadlineAlerts,
    weeklyDigest: weeklyPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.weeklyDigest,
    mentions: mentionPref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.mentions,
    emailTaskReminders: taskPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailTaskReminders,
    emailDeadlineAlerts:
      deadlinePref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailDeadlineAlerts,
    emailMentions: mentionPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailMentions,
    pushTaskReminders: taskPref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushTaskReminders,
    pushDeadlineAlerts:
      deadlinePref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushDeadlineAlerts,
    pushMentions: mentionPref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushMentions,
    certificateIssued:
      certificatePref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.certificateIssued,
    emailCertificateIssued:
      certificatePref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailCertificateIssued,
    pushCertificateIssued:
      certificatePref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushCertificateIssued,
    learningAssignments:
      learningPref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.learningAssignments,
    emailLearningAssignments:
      learningPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailLearningAssignments,
    pushLearningAssignments:
      learningPref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushLearningAssignments,
    courseCompletionReminders:
      courseReminderPref?.inAppEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.courseCompletionReminders,
    emailCourseCompletionReminders:
      courseReminderPref?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailCourseCompletionReminders,
    pushCourseCompletionReminders:
      courseReminderPref?.pushEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.pushCourseCompletionReminders,
  };
}

export function formToPreferences(
  userId: string,
  form: NotificationSettingsForm,
): NotificationPreference[] {
  return [
    pref(userId, GLOBAL_PREFERENCE_TYPE, {
      emailEnabled: form.emailEnabled,
      pushEnabled: form.pushEnabled,
      smsEnabled: form.smsEnabled,
      inAppEnabled: form.inAppEnabled,
      emailFrequency: form.emailFrequency,
      smsUrgentOnly: form.smsUrgentOnly,
      pushDesktopEnabled: form.pushDesktopEnabled,
      pushMobileEnabled: form.pushMobileEnabled,
      inAppSoundEnabled: form.inAppSoundEnabled,
    }),
    pref(userId, TASK_REMINDER_TYPE, {
      emailEnabled: form.emailTaskReminders,
      pushEnabled: form.pushTaskReminders,
      smsEnabled: form.taskReminders,
      inAppEnabled: form.taskReminders,
    }),
    pref(userId, DEADLINE_ALERT_TYPE, {
      emailEnabled: form.emailDeadlineAlerts,
      pushEnabled: form.pushDeadlineAlerts,
      smsEnabled: form.deadlineAlerts,
      inAppEnabled: form.deadlineAlerts,
    }),
    pref(userId, MENTION_TYPE, {
      emailEnabled: form.emailMentions,
      pushEnabled: form.pushMentions,
      smsEnabled: form.mentions,
      inAppEnabled: form.mentions,
    }),
    pref(userId, WEEKLY_DIGEST_TYPE, {
      emailEnabled: form.weeklyDigest,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: false,
      emailFrequency: 'weekly',
    }),
    pref(userId, CERTIFICATE_ISSUED_TYPE, {
      emailEnabled: form.emailCertificateIssued,
      pushEnabled: form.pushCertificateIssued,
      smsEnabled: false,
      inAppEnabled: form.certificateIssued,
    }),
    pref(userId, LEARNING_ASSIGNMENT_TYPE, {
      emailEnabled: form.emailLearningAssignments,
      pushEnabled: form.pushLearningAssignments,
      smsEnabled: false,
      inAppEnabled: form.learningAssignments,
    }),
    pref(userId, COURSE_COMPLETION_REMINDER_TYPE, {
      emailEnabled: form.emailCourseCompletionReminders,
      pushEnabled: form.pushCourseCompletionReminders,
      smsEnabled: false,
      inAppEnabled: form.courseCompletionReminders,
    }),
  ];
}

export async function fetchNotificationPreferences(
  userId: string,
): Promise<NotificationPreference[]> {
  const response = await fetch(`${NOTIFICATION_API}/notifications/preferences/${userId}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function syncNotificationPreferences(
  userId: string,
  preferences: NotificationPreference[],
): Promise<NotificationPreference[]> {
  const response = await fetch(`${NOTIFICATION_API}/notifications/preferences/${userId}/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences: preferences.map(({ notificationType, ...rest }) => ({
        notificationType,
        emailEnabled: rest.emailEnabled,
        pushEnabled: rest.pushEnabled,
        smsEnabled: rest.smsEnabled,
        inAppEnabled: rest.inAppEnabled,
        emailFrequency: rest.emailFrequency,
        smsUrgentOnly: rest.smsUrgentOnly,
        pushDesktopEnabled: rest.pushDesktopEnabled,
        pushMobileEnabled: rest.pushMobileEnabled,
        inAppSoundEnabled: rest.inAppSoundEnabled,
      })),
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function loadNotificationSettings(
  userId: string,
): Promise<NotificationSettingsForm> {
  const preferences = await fetchNotificationPreferences(userId);
  if (!preferences.length) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  return preferencesToForm(preferences);
}

export async function saveNotificationSettings(
  userId: string,
  form: NotificationSettingsForm,
): Promise<NotificationPreference[]> {
  return syncNotificationPreferences(userId, formToPreferences(userId, form));
}

export function getEmailFrequencyLabel(frequency: EmailFrequency): string {
  switch (frequency) {
    case 'daily':
      return 'Daily digest';
    case 'weekly':
      return 'Weekly digest';
    case 'urgent_only':
      return 'Urgent only';
    case 'off':
      return 'Off';
    default:
      return 'Instant';
  }
}

export type SimplePreferences = {
  enabled: boolean;
  process: boolean;
  actionPoint: boolean;
  ticket: boolean;
  learning: boolean;
};

export async function getSimplePreferences(userId: string): Promise<SimplePreferences> {
  try {
    const response = await fetch(`${NOTIFICATION_API}/notifications/preferences/${userId}/simple`);
    if (!response.ok) return { enabled: true, process: true, actionPoint: true, ticket: true, learning: true };
    return await response.json();
  } catch {
    return { enabled: true, process: true, actionPoint: true, ticket: true, learning: true };
  }
}

export async function updateSimplePreferences(
  userId: string,
  prefs: SimplePreferences,
): Promise<SimplePreferences> {
  const response = await fetch(`${NOTIFICATION_API}/notifications/preferences/${userId}/simple`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) return prefs;
  return await response.json();
}

export async function fetchUserNotifications(userId: string): Promise<AppNotification[]> {
  const response = await fetch(`${NOTIFICATION_API}/notifications/user/${userId}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(notificationId: string): Promise<AppNotification | null> {
  const response = await fetch(`${NOTIFICATION_API}/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
  if (!response.ok) return null;
  return response.json();
}

export function getNotificationTypeLabel(type: string, t?: (key: string) => string): string {
  const translate = t ?? ((key: string) => key);
  switch (type) {
    case CERTIFICATE_ISSUED_TYPE:
      return translate('certificateIssued') || 'Certificate issued';
    case LEARNING_ASSIGNMENT_TYPE:
      return translate('learningAssignments') || 'Learning assignments';
    case COURSE_COMPLETION_REMINDER_TYPE:
      return translate('courseCompletionReminders') || 'Course completion reminders';
    case TASK_REMINDER_TYPE:
      return translate('taskReminders') || 'Task reminders';
    case DEADLINE_ALERT_TYPE:
      return translate('deadlineAlerts') || 'Deadline alerts';
    case MENTION_TYPE:
      return translate('mentions') || 'Mentions';
    case WEEKLY_DIGEST_TYPE:
      return translate('weeklyDigest') || 'Weekly digest';
    case PROCESS_ASSIGNED_TYPE:
      return 'Process';
    case AUDIT_ASSIGNED_TYPE:
      return 'Audit';
    case ACTION_POINT_ASSIGNED_TYPE:
      return 'Action Point';
    case TICKET_ASSIGNED_TYPE:
      return 'Ticket';
    default:
      return type.replace(/_/g, ' ');
  }
}
