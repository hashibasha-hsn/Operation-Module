import { NotificationPreference, EmailFrequency } from './notification-preference.entity';

export const GLOBAL_PREFERENCE_TYPE = '_global';
export const TASK_REMINDER_TYPE = 'task_reminder';
export const DEADLINE_ALERT_TYPE = 'deadline_alert';
export const MENTION_TYPE = 'mention';
export const WEEKLY_DIGEST_TYPE = 'weekly_digest';
export const CERTIFICATE_ISSUED_TYPE = 'certificate_issued';
export const LEARNING_ASSIGNMENT_TYPE = 'learning_assignment';
export const COURSE_COMPLETION_REMINDER_TYPE = 'course_completion_reminder';
export const PROCESS_ASSIGNED_TYPE = 'process_assigned';
export const ACTION_POINT_ASSIGNED_TYPE = 'action_point_assigned';
export const TICKET_ASSIGNED_TYPE = 'ticket_assigned';
export const REVIEW_REQUESTED_TYPE = 'review_requested';
export const REVIEW_RESOLVED_TYPE = 'review_resolved';

export const ALL_PREFERENCE_TYPES = [
  GLOBAL_PREFERENCE_TYPE,
  TASK_REMINDER_TYPE,
  DEADLINE_ALERT_TYPE,
  MENTION_TYPE,
  WEEKLY_DIGEST_TYPE,
  CERTIFICATE_ISSUED_TYPE,
  LEARNING_ASSIGNMENT_TYPE,
  COURSE_COMPLETION_REMINDER_TYPE,
  PROCESS_ASSIGNED_TYPE,
  ACTION_POINT_ASSIGNED_TYPE,
  TICKET_ASSIGNED_TYPE,
  REVIEW_REQUESTED_TYPE,
  REVIEW_RESOLVED_TYPE,
] as const;

export type PreferenceType = (typeof ALL_PREFERENCE_TYPES)[number];

export function buildDefaultPreferences(userId: string): Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] {
  const base = { userId, emailFrequency: 'instant' as EmailFrequency, smsUrgentOnly: true, pushDesktopEnabled: true, pushMobileEnabled: true, inAppSoundEnabled: true };

  return [
    {
      ...base,
      notificationType: GLOBAL_PREFERENCE_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      emailFrequency: 'instant',
    },
    {
      ...base,
      notificationType: TASK_REMINDER_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: DEADLINE_ALERT_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: MENTION_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: WEEKLY_DIGEST_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: false,
      emailFrequency: 'weekly',
    },
    {
      ...base,
      notificationType: CERTIFICATE_ISSUED_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: LEARNING_ASSIGNMENT_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: COURSE_COMPLETION_REMINDER_TYPE,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: PROCESS_ASSIGNED_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: ACTION_POINT_ASSIGNED_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: TICKET_ASSIGNED_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: REVIEW_REQUESTED_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
    },
    {
      ...base,
      notificationType: REVIEW_RESOLVED_TYPE,
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
    },
  ];
}
