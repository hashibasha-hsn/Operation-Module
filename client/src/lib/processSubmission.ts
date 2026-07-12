import { ORG_API } from './apiConfig';

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function getCurrentUserId() {
  const user = getCurrentUser();
  return user.userId ?? user.id ?? '';
}

export function getCurrentUserDisplayName() {
  const user = getCurrentUser();
  const fullName =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email || 'Unknown';
}

export async function fetchAssignedProcesses(userId: string, storeId?: string) {
  const params = new URLSearchParams({
    userId,
    organizationId: 'default-org',
  });
  if (storeId) params.set('storeId', storeId);
  const response = await fetch(`${ORG_API}/processes/assigned/list?${params}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchPublishedProcesses() {
  const response = await fetch(`${ORG_API}/processes/published/list?organizationId=default-org`);
  if (!response.ok) return [];
  return response.json();
}

export async function assignUserToProcesses(userId: string, processIds: string[]) {
  const response = await fetch(`${ORG_API}/processes/assign-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, processIds }),
  });
  if (!response.ok) {
    throw new Error('Failed to assign processes to user');
  }
}

export async function fetchProcessDraft(processId: string, userId: string, storeId: string) {
  const params = new URLSearchParams({
    processId,
    userId,
    storeId,
    organizationId: 'default-org',
  });
  const response = await fetch(`${ORG_API}/submissions/process/draft?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data?.id ? data : null;
}

export async function fetchUserSubmissions(userId: string) {
  const response = await fetch(
    `${ORG_API}/submissions/process/user?userId=${userId}&organizationId=default-org`,
  );
  if (!response.ok) return [];
  return response.json();
}

export async function fetchProcessById(id: string) {
  const response = await fetch(`${ORG_API}/processes/${id}`);
  if (!response.ok) throw new Error('Process not found');
  return response.json();
}

export async function startProcessSubmission(payload: {
  processId: string;
  userId: string;
  storeId: string;
  submissionDate?: string;
}) {
  const response = await fetch(`${ORG_API}/submissions/process/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId: 'default-org' }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Failed to start process');
  return data;
}

export async function saveSubmissionDraft(
  submissionId: string,
  userId: string,
  responses: Record<string, unknown>,
  submissionDate?: string,
) {
  const response = await fetch(`${ORG_API}/submissions/process/${submissionId}/save`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      answers: { responses, submissionDate },
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Failed to save draft');
  return data;
}

export async function submitProcessSubmission(
  submissionId: string,
  userId: string,
  responses: Record<string, unknown>,
  submissionDate?: string,
) {
  const response = await fetch(`${ORG_API}/submissions/process/${submissionId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      answers: { responses, submissionDate },
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Failed to submit process');
  return data;
}

export async function discardSubmissionDraft(submissionId: string, userId: string) {
  const response = await fetch(
    `${ORG_API}/submissions/process/${submissionId}/discard?userId=${userId}`,
    { method: 'DELETE' },
  );
  if (!response.ok) throw new Error('Failed to discard draft');
}

export async function fetchEntitiesForUser() {
  const response = await fetch(`${ORG_API}/entities?organizationId=default-org`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : data?.value ?? [];
}
