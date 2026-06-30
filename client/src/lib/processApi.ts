import { buildDraftPayload, ProcessDraftState, saveProcessDraftLocal } from './processDraft';
import { mergeProcessProperties, propertiesFromApiProcess, propertiesToApiPayload } from './processProperties';

const ORG_API = 'http://localhost:3009/api/org';

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

export async function fetchProcesses(organizationId = 'default-org') {
  const response = await fetch(`${ORG_API}/processes?organizationId=${organizationId}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function deleteProcess(id: string) {
  const response = await fetch(`${ORG_API}/processes/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to delete process');
  }
}

export async function fetchProcessTags(organizationId = 'default-org') {
  const response = await fetch(
    `http://localhost:3009/api/user/tags/process?organizationId=${organizationId}`,
  );
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.tags ?? [];
}

export async function fetchQuestionTags(organizationId = 'default-org') {
  const response = await fetch(
    `http://localhost:3009/api/user/tags/question?organizationId=${organizationId}`,
  );
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.tags ?? [];
}

export async function fetchUsers(limit = 50) {
  const response = await fetch(`http://localhost:3009/api/user/users?limit=${limit}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data?.users ?? (Array.isArray(data) ? data : []);
}

export function getUserDisplayName(user: Record<string, unknown>): string {
  const name = String(user.name ?? user.fullName ?? "").trim();
  if (name) return name;
  const email = user.email;
  if (typeof email === "string" && email.trim()) return email.trim();
  const id = user.userId ?? user.id;
  return typeof id === "string" ? id : "Unknown";
}

export async function fetchEntities(organizationId = 'default-org') {
  const response = await fetch(`${ORG_API}/entities?organizationId=${organizationId}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data?.value ?? [];
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
