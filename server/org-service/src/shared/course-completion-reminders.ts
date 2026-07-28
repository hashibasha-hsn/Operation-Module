import { Course } from '../courses/course.entity';
import { CourseProgress } from '../courses/course-progress.entity';
import { notifyCourseCompletionReminder } from './notification-client';

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;
const STALE_INCOMPLETE_DAYS = 7;

export type ReminderKind = 'due_soon' | 'overdue' | 'incomplete';

export function resolveCourseReminderKind(
  course: Course,
  progress: CourseProgress,
  now = new Date(),
): ReminderKind | null {
  if (progress.status === 'completed') return null;

  const dueAt = course.expiresAt ? new Date(course.expiresAt) : null;
  if (dueAt) {
    const daysUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= DUE_SOON_DAYS) return 'due_soon';
    return null;
  }

  const reference = progress.startedAt ?? progress.createdAt;
  if (!reference) return null;
  const daysSinceActivity =
    (now.getTime() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24);
  if (progress.status !== 'not_started' && daysSinceActivity >= STALE_INCOMPLETE_DAYS) {
    return 'incomplete';
  }
  if (progress.status === 'not_started' && daysSinceActivity >= STALE_INCOMPLETE_DAYS) {
    return 'incomplete';
  }

  return null;
}

export function canSendCourseReminder(progress: CourseProgress, now = new Date()): boolean {
  if (!progress.lastReminderAt) return true;
  return now.getTime() - new Date(progress.lastReminderAt).getTime() >= REMINDER_COOLDOWN_MS;
}

export async function sendCourseCompletionReminderIfNeeded(
  course: Course,
  progress: CourseProgress,
  updateLastReminderAt: (progressId: string, at: Date) => Promise<void>,
): Promise<boolean> {
  const kind = resolveCourseReminderKind(course, progress);
  if (!kind || !canSendCourseReminder(progress)) return false;

  await notifyCourseCompletionReminder({
    userId: progress.userId,
    courseTitle: course.title,
    courseId: course.id,
    progressId: progress.id,
    progressPercent: progress.progress ?? 0,
    dueAt: course.expiresAt ?? null,
    reminderKind: kind,
  });

  await updateLastReminderAt(progress.id, new Date());
  return true;
}
