import { ORG_API } from './apiConfig';


export function getSubmissionContext() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      organizationId: user.organizationId || 'default-org',
      userId: user.userId ?? user.id ?? '',
    };
  } catch {
    return { organizationId: 'default-org', userId: '' };
  }
}

export async function fetchPendingApprovals() {
  const { organizationId, userId } = getSubmissionContext();
  const response = await fetch(
    `${ORG_API}/submissions/pending?userId=${userId}&organizationId=${organizationId}`,
  );
  if (!response.ok) throw new Error('Failed to load pending approvals');
  return response.json();
}

export async function approveSubmission(id: string) {
  const { userId } = getSubmissionContext();
  const response = await fetch(`${ORG_API}/submissions/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId: userId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Approve failed');
  }
  return response.json();
}

export async function sendSubmissionForCorrection(id: string, correctionNotes: string) {
  const { userId } = getSubmissionContext();
  const response = await fetch(`${ORG_API}/submissions/${id}/correction`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId: userId, correctionNotes }),
  });
  if (!response.ok) throw new Error('Failed to send for correction');
  return response.json();
}

export async function rejectSubmission(id: string, rejectionReason: string) {
  const { userId } = getSubmissionContext();
  const response = await fetch(`${ORG_API}/submissions/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId: userId, rejectionReason }),
  });
  if (!response.ok) throw new Error('Failed to reject submission');
  return response.json();
}
