import { getCurrentUserId, getOrganizationId } from '@/lib/authStorage';
import { buildDraftPayload, ProcessDraftState, saveProcessDraftLocal } from './processDraft';
import { mergeProcessProperties, propertiesFromApiProcess, propertiesToApiPayload } from './processProperties';
import { humanLabel } from './displayLabels';
import { getReportContext } from './reportApi';

import { USER_API } from './apiConfig';
const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

export async function saveProcessDraft(draft: ProcessDraftState) {
  const response = await fetch(`${ORG_API}/processes/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildDraftPayload(draft)),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save process draft');
  }

  const updatedDraft: ProcessDraftState = {
    id: data.id,
    title: data.title ?? draft.title,
    description: data.description ?? draft.description,
    processTags: data.processTags ?? draft.processTags,
    properties: propertiesFromApiProcess({ ...data, properties: data.properties ?? draft.properties }),
    assigneeIds: data.assigneeIds ?? draft.assigneeIds ?? [],
    storeIds: data.storeIds ?? draft.storeIds ?? [],
    sections: (data.sections ?? draft.sections).map((section: any, index: number) => ({
      clientId: section.id ?? `section-${index + 1}`,
      title: section.title,
      description: section.description ?? '',
      displayOrder: section.displayOrder ?? index,
      questions: (section.questions ?? []).map((question: any, qIndex: number) => ({
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ?? {},
        isRequired: question.isRequired ?? false,
        validationRules: question.validationRules ?? undefined,
        displayOrder: question.displayOrder ?? qIndex,
      })),
    })),
  };

  saveProcessDraftLocal(updatedDraft);
  return updatedDraft;
}

export async function fetchProcesses(organizationId?: string) {
  const orgId = organizationId || getReportContext().organizationId || getOrganizationId();
  const response = await fetch(`${ORG_API}/processes?organizationId=${encodeURIComponent(orgId)}`);
  if (!response.ok) {
    throw new Error(`Failed to load processes (${response.status})`);
  }
  return response.json();
}

export async function deleteProcess(id: string) {
  const headers: Record<string, string> = {};
  const userId = getCurrentUserId();
  if (userId) headers['x-user-id'] = userId;
  const response = await fetch(`${ORG_API}/processes/${id}`, { method: 'DELETE', headers });
  if (!response.ok) {
    throw new Error('Failed to delete process');
  }
}

export async function fetchProcessTags(organizationId = getOrganizationId()) {
  const response = await fetch(
    `${USER_API}/tags/process?organizationId=${organizationId}`,
  );
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.tags ?? [];
}

export async function fetchQuestionTags(organizationId = getOrganizationId()) {
  const response = await fetch(
    `${USER_API}/tags/question?organizationId=${organizationId}`,
  );
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.tags ?? [];
}

export async function fetchUsers(limit = 50) {
  const response = await fetch(`${USER_API}/users?limit=${limit}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data?.users ?? (Array.isArray(data) ? data : []);
}

export function getUserDisplayName(user: Record<string, unknown>): string {
  return humanLabel(
    user.name,
    user.fullName,
    user.email,
    user.employeeId,
    'Unknown user',
  );
}

export async function fetchEntities(organizationId = getOrganizationId()) {
  const response = await fetch(`${ORG_API}/entities?organizationId=${organizationId}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.value ?? [];
}

export async function fetchAssigneeProfiles(organizationId = getOrganizationId()) {
  try {
    const response = await fetch(
      `${USER_API}/tags/assignee-profile?organizationId=${organizationId}`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.profiles) ? data.profiles : [];
  } catch {
    return [];
  }
}

export async function assignProcess(
  id: string,
  assignment: { assigneeIds?: string[]; storeIds?: string[] },
) {
  const response = await fetch(`${ORG_API}/processes/${id}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save assignment');
  }
  return data;
}

export async function publishProcess(id: string) {
  const response = await fetch(`${ORG_API}/processes/${id}/publish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to publish process');
  }
  return data;
}
