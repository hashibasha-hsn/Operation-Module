import { getOrganizationId } from '@/lib/authStorage';

const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export {
  getCurrentUser,
  getCurrentUserId,
  fetchEntitiesForUser,
} from './processSubmission';

export async function fetchAssignedAudits(userId: string, storeId?: string) {
  const params = new URLSearchParams({
    userId,
    organizationId: getOrganizationId(),
  });
  if (storeId) params.set('storeId', storeId);
  const response = await fetch(`${ORG_API}/audits/assigned/list?${params}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchUserAuditSubmissions(userId: string) {
  const response = await fetch(
    `${ORG_API}/submissions/audit/user?userId=${encodeURIComponent(userId)}&organizationId=${encodeURIComponent(getOrganizationId())}`,
  );
  if (!response.ok) return [];
  return response.json();
}

export async function fetchAuditById(id: string) {
  const response = await fetch(`${ORG_API}/audits/${id}/with-sections`);
  if (!response.ok) throw new Error('Audit not found');
  return response.json();
}

export async function startAuditSubmission(payload: {
  auditId: string;
  userId: string;
  storeId: string;
  submissionDate?: string;
}) {
  const response = await fetch(`${ORG_API}/submissions/audit/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId: getOrganizationId() }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Failed to start audit');
  return data;
}

export async function saveAuditSubmissionDraft(
  submissionId: string,
  userId: string,
  responses: Record<string, unknown>,
  submissionDate?: string,
) {
  const response = await fetch(`${ORG_API}/submissions/audit/${submissionId}/save`, {
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

export async function submitAuditSubmission(
  submissionId: string,
  userId: string,
  responses: Record<string, unknown>,
  submissionDate?: string,
) {
  const response = await fetch(`${ORG_API}/submissions/audit/${submissionId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      answers: { responses, submissionDate },
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Failed to submit audit');
  return data;
}

export async function discardAuditSubmissionDraft(submissionId: string, userId: string) {
  const response = await fetch(
    `${ORG_API}/submissions/audit/${submissionId}/discard?userId=${userId}`,
    { method: 'DELETE' },
  );
  if (!response.ok) throw new Error('Failed to discard draft');
}
