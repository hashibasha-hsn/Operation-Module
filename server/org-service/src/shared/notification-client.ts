export const CERTIFICATE_ISSUED_TYPE = 'certificate_issued';
export const LEARNING_ASSIGNMENT_TYPE = 'learning_assignment';
export const COURSE_COMPLETION_REMINDER_TYPE = 'course_completion_reminder';
export const PROCESS_ASSIGNED_TYPE = 'process_assigned';
export const AUDIT_ASSIGNED_TYPE = 'audit_assigned';
export const ACTION_POINT_ASSIGNED_TYPE = 'action_point_assigned';
export const TICKET_ASSIGNED_TYPE = 'ticket_assigned';

const GATEWAY_URL =
  process.env.GATEWAY_URL || 'https://hashibasha-gateway.up.railway.app';

const NOTIFICATION_API_URL =
  process.env.NOTIFICATION_SERVICE_URL || `${GATEWAY_URL}/api/notification`;

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  content?: string;
  data?: Record<string, unknown>;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  deliveryMethod?: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
};

async function tryPost(url: string, body: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (response.ok) return true;
    const text = await response.text();
    console.warn('[notification-client] failed', url, response.status, text);
  } catch (error) {
    console.warn('[notification-client] error', url, error);
  }
  return false;
}

async function sendUserNotification(payload: NotificationPayload): Promise<void> {
  const body = JSON.stringify({
    ...payload,
    priority: payload.priority ?? 'NORMAL',
    deliveryMethod: payload.deliveryMethod ?? 'IN_APP',
    status: 'PENDING',
  });

  const primary = `${NOTIFICATION_API_URL}/notifications`;
  const ok = await tryPost(primary, body);
  if (ok) return;

  // Fallback: try direct notification service URL
  const directUrl = process.env.NOTIFICATION_SERVICE_URL;
  if (directUrl && !primary.startsWith(directUrl)) {
    await tryPost(`${directUrl}/notifications`, body);
  }
}

export async function notifyCertificateIssued(input: {
  userId: string;
  itemTitle: string;
  itemType: 'assessment' | 'course';
  itemId: string;
  resultId?: string;
  score?: number;
  percentage?: number;
}): Promise<void> {
  const link =
    input.itemType === 'assessment'
      ? `/learning/assessment/${input.itemId}`
      : `/learning/courses/${input.itemId}`;

  await sendUserNotification({
    userId: input.userId,
    type: CERTIFICATE_ISSUED_TYPE,
    title: 'Certificate issued',
    content: `Your certificate for "${input.itemTitle}" is ready.`,
    data: {
      itemType: input.itemType,
      itemId: input.itemId,
      resultId: input.resultId ?? null,
      score: input.score ?? null,
      percentage: input.percentage ?? null,
      link,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyLearningAssignment(input: {
  userId: string;
  itemTitle: string;
  itemType: 'assessment' | 'course';
  itemId: string;
  dueAt?: Date | string | null;
}): Promise<void> {
  const link =
    input.itemType === 'assessment'
      ? `/learning/assessment/${input.itemId}`
      : `/learning/courses/${input.itemId}`;

  const dueText = input.dueAt
    ? ` Due date: ${new Date(input.dueAt).toLocaleDateString()}.`
    : '';

  await sendUserNotification({
    userId: input.userId,
    type: LEARNING_ASSIGNMENT_TYPE,
    title: input.itemType === 'assessment' ? 'New assessment assigned' : 'New learning assignment',
    content:
      input.itemType === 'assessment'
        ? `You have been assigned the assessment "${input.itemTitle}".${dueText}`
        : `You have been assigned "${input.itemTitle}".${dueText}`,
    data: {
      itemType: input.itemType,
      itemId: input.itemId,
      dueAt: input.dueAt ?? null,
      link,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyAssessmentAssignment(input: {
  userId: string;
  assessmentTitle: string;
  assessmentId: string;
  dueAt?: Date | string | null;
}): Promise<void> {
  return notifyLearningAssignment({
    userId: input.userId,
    itemTitle: input.assessmentTitle,
    itemType: 'assessment',
    itemId: input.assessmentId,
    dueAt: input.dueAt,
  });
}

export async function notifyCourseCompletionReminder(input: {
  userId: string;
  courseTitle: string;
  courseId: string;
  progressId: string;
  progressPercent: number;
  dueAt?: Date | string | null;
  reminderKind: 'due_soon' | 'overdue' | 'incomplete';
}): Promise<void> {
  const dueLabel = input.dueAt ? new Date(input.dueAt).toLocaleDateString() : null;
  let content = `Reminder: complete "${input.courseTitle}" (${input.progressPercent}% done).`;
  if (input.reminderKind === 'overdue' && dueLabel) {
    content = `"${input.courseTitle}" was due on ${dueLabel}. You are ${input.progressPercent}% complete.`;
  } else if (input.reminderKind === 'due_soon' && dueLabel) {
    content = `"${input.courseTitle}" is due on ${dueLabel}. Current progress: ${input.progressPercent}%.`;
  }

  await sendUserNotification({
    userId: input.userId,
    type: COURSE_COMPLETION_REMINDER_TYPE,
    title: 'Course completion reminder',
    content,
    data: {
      itemType: 'course',
      itemId: input.courseId,
      progressId: input.progressId,
      progressPercent: input.progressPercent,
      dueAt: input.dueAt ?? null,
      reminderKind: input.reminderKind,
      link: `/learning/courses/${input.courseId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: input.reminderKind === 'overdue' ? 'HIGH' : 'NORMAL',
  });
}

export async function notifyProcessAssigned(input: {
  userId: string;
  processTitle: string;
  processId: string;
  assignedBy?: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: PROCESS_ASSIGNED_TYPE,
    title: 'New process assigned',
    content: `You have been assigned the process "${input.processTitle}".`,
    data: {
      itemType: 'process',
      itemId: input.processId,
      assignedBy: input.assignedBy ?? null,
      link: `/process/${input.processId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyAuditAssigned(input: {
  userId: string;
  auditTitle: string;
  auditId: string;
  assignedBy?: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: AUDIT_ASSIGNED_TYPE,
    title: 'New audit assigned',
    content: `You have been assigned the audit "${input.auditTitle}".`,
    data: {
      itemType: 'audit',
      itemId: input.auditId,
      assignedBy: input.assignedBy ?? null,
      link: `/audit/${input.auditId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyActionPointAssigned(input: {
  userId: string;
  actionPointTitle: string;
  actionPointId: string;
  assignedBy?: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: ACTION_POINT_ASSIGNED_TYPE,
    title: 'New action point assigned',
    content: `You have been assigned the action point "${input.actionPointTitle}".`,
    data: {
      itemType: 'action_point',
      itemId: input.actionPointId,
      assignedBy: input.assignedBy ?? null,
      link: `/action-points/${input.actionPointId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyTicketAssigned(input: {
  userId: string;
  ticketTitle: string;
  ticketId: string;
  assignedBy?: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: TICKET_ASSIGNED_TYPE,
    title: 'New ticket assigned',
    content: `You have been assigned the ticket "${input.ticketTitle}".`,
    data: {
      itemType: 'ticket',
      itemId: input.ticketId,
      assignedBy: input.assignedBy ?? null,
      link: `/tickets/${input.ticketId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}
