import { ORG_API } from './apiConfig';

const DEFAULT_ORGANIZATION_ID = 'default-org';

export type EntityRecord = Record<string, unknown> & {
  id: string;
  storeName: string;
  entityId?: string;
};

function buildEntitiesUrl(search?: string, organizationId = DEFAULT_ORGANIZATION_ID) {
  const params = new URLSearchParams({ organizationId });
  if (search?.trim()) {
    params.set('search', search.trim());
  }
  return `${ORG_API}/entities?${params.toString()}`;
}

export async function fetchEntities(search?: string, organizationId = DEFAULT_ORGANIZATION_ID) {
  const response = await fetch(buildEntitiesUrl(search, organizationId));
  if (!response.ok) {
    throw new Error(`Failed to fetch entities (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchEntityById(id: string) {
  const response = await fetch(`${ORG_API}/entities/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch entity (${response.status})`);
  }
  return response.json();
}

export async function createEntity(payload: Record<string, unknown>) {
  const response = await fetch(`${ORG_API}/entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      (response.status === 409
        ? 'An entity with this Entity ID already exists'
        : `Failed to create entity (${response.status})`);
    throw new Error(message);
  }
  return data;
}

export async function updateEntity(id: string, payload: Record<string, unknown>) {
  const response = await fetch(`${ORG_API}/entities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Failed to update entity (${response.status})`);
  }
  return data;
}

export async function deleteEntity(id: string) {
  const response = await fetch(`${ORG_API}/entities/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to delete entity (${response.status})`);
  }
}
