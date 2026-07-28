import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export function getActionPointContext() {
  const user = getStoredUser();
  return {
    organizationId: getOrganizationId(),
    userId: (user.userId ?? user.id ?? '') as string,
    userName: (user.name ?? user.fullName ?? user.email ?? '') as string,
  };
}

async function orgRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ORG_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Action point request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type ActionPointTab = 'assigned' | 'created' | 'closure';

export async function fetchActionPointsByTab(tab: ActionPointTab = 'assigned') {
  const { organizationId, userId } = getActionPointContext();
  const endpoints: Record<ActionPointTab, string> = {
    assigned: `/action-points/assigned-to-me?userId=${userId}&organizationId=${organizationId}`,
    created: `/action-points/created-by-me?userId=${userId}&organizationId=${organizationId}`,
    closure: `/action-points/closure-assigned-to-me?userId=${userId}&organizationId=${organizationId}`,
  };
  return orgRequest<any[]>(endpoints[tab]);
}

export async function fetchAllActionPoints() {
  const { organizationId } = getActionPointContext();
  return orgRequest<any[]>(`/action-points?organizationId=${organizationId}`);
}

export async function createActionPoint(payload: Partial<{
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
  closureAssignedTo: string;
  dueDate: string;
  storeId: string;
  submissionId: string;
  questionId: string;
  workflowType: string;
  workflowId: string;
  triggerType: string;
  autoTriggerConfig: Record<string, unknown>;
  attachments: unknown[];
}>) {
  const { organizationId, userId } = getActionPointContext();
  return orgRequest<any>('/action-points', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      organizationId,
      createdBy: userId,
      status: 'open',
    }),
  });
}

export async function updateActionPointStatus(id: string, status: string) {
  const { userId } = getActionPointContext();
  return orgRequest<any>(`/action-points/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, userId }),
  });
}

export async function addActionPointComment(id: string, text: string) {
  const { userId } = getActionPointContext();
  return orgRequest<any>(`/action-points/${id}/comments`, {
    method: 'PUT',
    body: JSON.stringify({ text, userId, timestamp: new Date().toISOString() }),
  });
}

export async function deleteActionPoint(id: string) {
  return orgRequest<void>(`/action-points/${id}`, { method: 'DELETE' });
}

export type QuestionForActionPoint = {
  id: string;
  questionText: string;
  options?: Record<string, unknown>;
};

export async function createActionPointsFromSubmission(payload: {
  submissionId: string;
  workflowType: 'process' | 'audit';
  workflowId: string;
  storeId: string;
  responses: Record<string, string>;
  questions: QuestionForActionPoint[];
}) {
  const { organizationId, userId } = getActionPointContext();
  return orgRequest<any[]>('/action-points/from-submission', {
    method: 'POST',
    body: JSON.stringify({ ...payload, organizationId, createdBy: userId }),
  });
}

export function exportActionPointsToCsv(
  actionPoints: any[],
  fields: 'shown' | 'all' = 'shown',
) {
  const shownHeaders = ['id', 'title', 'priority', 'status', 'assignedTo', 'dueDate'];
  const allHeaders = [
    ...shownHeaders,
    'description',
    'triggerType',
    'storeId',
    'workflowType',
    'createdAt',
  ];
  const headers = fields === 'all' ? allHeaders : shownHeaders;
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = actionPoints.map((ap) =>
    headers.map((key) => {
      const val = ap[key];
      if (val instanceof Date) return val.toISOString();
      return String(val ?? '');
    }),
  );
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `action-points-${fields}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function getQuestionActionPointMode(question: any): 'none' | 'manual' | 'auto' {
  const opts = question?.options ?? {};
  const mode = opts.actionPoint ?? opts.addons?.actionPoint;
  if (mode === 'manual' || mode === 'auto') return mode;
  return 'none';
}

export function getQuestionAutoTriggers(question: any): string[] {
  const opts = question?.options ?? {};
  return (opts.actionPointAutoTriggers as string[]) ?? [];
}
