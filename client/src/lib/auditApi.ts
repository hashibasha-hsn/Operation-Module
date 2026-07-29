import { getOrganizationId } from '@/lib/authStorage';
import {
  apiAuditToDraft,
  AuditDraftState,
  buildAuditDraftPayload,
  loadAuditDraft,
  saveAuditDraftLocal,
} from './auditDraft';
import { propertiesFromApiProcess } from './processProperties';

const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

export async function saveAuditDraft(draft: AuditDraftState) {
  const response = await fetch(`${ORG_API}/audits/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildAuditDraftPayload(draft)),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save audit draft');
  }

  const updatedDraft: AuditDraftState = {
    ...apiAuditToDraft({
      ...data,
      properties: data.properties ?? draft.properties,
      passThreshold: data.passThreshold ?? draft.passThreshold,
      reviewLevels: data.reviewLevels ?? draft.reviewLevels,
    }),
    assigneeIds: data.assigneeIds ?? draft.assigneeIds ?? [],
    storeIds: data.storeIds ?? draft.storeIds ?? [],
    assignBy: draft.assignBy,
  };
  saveAuditDraftLocal(updatedDraft);
  return updatedDraft;
}

/** Sync local audit draft to the server (creates or updates draft id). */
export async function ensureAuditDraftSaved(draft?: AuditDraftState): Promise<AuditDraftState> {
  const current = draft ?? loadAuditDraft();
  if (!current.title?.trim()) {
    throw new Error('Audit title is required');
  }
  return saveAuditDraft(current);
}

export async function fetchAudits(organizationId = getOrganizationId()) {
  const response = await fetch(`${ORG_API}/audits?organizationId=${organizationId}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchAuditWithSections(id: string) {
  const response = await fetch(`${ORG_API}/audits/${id}/with-sections`);
  if (!response.ok) throw new Error('Audit not found');
  return response.json();
}

export async function deleteAudit(id: string) {
  const response = await fetch(`${ORG_API}/audits/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete audit');
}

export { fetchProcessTags as fetchAuditTags, fetchUsers, fetchEntities } from './processApi';

export async function assignAudit(
  id: string,
  assignment: { assigneeIds?: string[]; storeIds?: string[] },
) {
  const response = await fetch(`${ORG_API}/audits/${id}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save audit assignment');
  }
  return data;
}

export async function publishAudit(id: string) {
  const response = await fetch(`${ORG_API}/audits/${id}/publish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to publish audit');
  }
  return data;
}

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

export async function loadAuditIntoDraft(id: string): Promise<AuditDraftState> {
  const audit = await fetchAuditWithSections(id);
  const draft = apiAuditToDraft({
    ...audit,
    properties: propertiesFromApiProcess(audit),
  });
  saveAuditDraftLocal(draft);
  return draft;
}
