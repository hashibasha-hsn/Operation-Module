import { getOrganizationId } from '@/lib/authStorage';
import {
  apiAssessmentToDraft,
  AssessmentDraftState,
  buildAssessmentDraftPayload,
  clearAssessmentDraftLocal,
  loadAssessmentDraft,
  saveAssessmentDraftLocal,
} from './assessmentDraft';

const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';
const USER_API = import.meta.env.VITE_USER_API || 'http://localhost:3009/api/user';

export async function saveAssessmentDraft(draft: AssessmentDraftState) {
  const response = await fetch(`${ORG_API}/assessments/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildAssessmentDraftPayload(draft)),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save assessment draft');
  }

  const updatedDraft = apiAssessmentToDraft(data);
  saveAssessmentDraftLocal(updatedDraft);
  return updatedDraft;
}

export async function ensureAssessmentDraftSaved(draft?: AssessmentDraftState): Promise<AssessmentDraftState> {
  const current = draft ?? loadAssessmentDraft();
  if (!current.title?.trim()) {
    throw new Error('Assessment title is required');
  }
  return saveAssessmentDraft(current);
}

export async function fetchAssessments(organizationId = getOrganizationId(), status?: string) {
  const params = new URLSearchParams({ organizationId });
  if (status) params.set('status', status);
  const response = await fetch(`${ORG_API}/assessments?${params}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchEntities(organizationId = getOrganizationId()) {
  try {
    const response = await fetch(`${ORG_API}/entities?organizationId=${organizationId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
  } catch {
    return [];
  }
}

export async function fetchDesignations(organizationId = getOrganizationId()) {
  try {
    const response = await fetch(
      `${USER_API}/designations?organizationId=${encodeURIComponent(organizationId)}`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.designations) ? data.designations : [];
  } catch {
    return [];
  }
}

export async function fetchAssigneeProfiles(organizationId = getOrganizationId()) {
  try {
    const response = await fetch(
      `${USER_API}/tags/assignee-profile?organizationId=${encodeURIComponent(organizationId)}`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.profiles) ? data.profiles : [];
  } catch {
    return [];
  }
}

export async function fetchAssessment(id: string) {
  const response = await fetch(`${ORG_API}/assessments/${id}`);
  if (!response.ok) throw new Error('Assessment not found');
  return response.json();
}

export async function deleteAssessment(id: string) {
  const response = await fetch(`${ORG_API}/assessments/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete assessment');
}

export async function assignAssessment(
  id: string,
  assignment: { assigneeIds?: string[]; storeIds?: string[]; assigneeProfiles?: Record<string, unknown> },
) {
  const response = await fetch(`${ORG_API}/assessments/${id}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save assessment assignment');
  }
  return data;
}

export async function publishAssessment(id: string) {
  const response = await fetch(`${ORG_API}/assessments/${id}/publish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to publish assessment');
  }
  return data;
}

export async function fetchAssignedAssessments(userId: string, storeId?: string) {
  const params = new URLSearchParams({ userId, organizationId: getOrganizationId() });
  if (storeId) params.set('storeId', storeId);
  const response = await fetch(`${ORG_API}/assessments/assigned/list?${params}`);
  if (!response.ok) return [];
  return response.json();
}

export {
  fetchUsers,
} from './processApi';
export {
  clearAssessmentDraftLocal,
  loadAssessmentDraft,
  apiAssessmentToDraft,
  saveAssessmentDraftLocal,
  emptyAssessmentDraft,
} from './assessmentDraft';
