import { USER_API } from './apiConfig';

const BASE_URL = `${USER_API}/hybrid-assignee-profiles`;

const ORG_ID = 'default-org';

export type HybridDashboardStats = {
  activeStores: number;
  profileCount: number;
  maxProfiles: number;
  totalAssignments: number;
};

export type HybridDashboardProfile = {
  id: string;
  name: string;
  isPublished: boolean;
};

export type HybridDashboardStore = {
  storeId: string;
};

export type HybridDashboard = {
  stats: HybridDashboardStats;
  stores: HybridDashboardStore[];
  profiles: HybridDashboardProfile[];
  cells: Record<string, string[]>;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string | string[] }).message)
        : `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

export async function fetchHybridDashboard(): Promise<HybridDashboard> {
  const response = await fetch(`${BASE_URL}/dashboard?organizationId=${ORG_ID}`);
  return parseJson<HybridDashboard>(response);
}

export async function createHybridProfile(name: string): Promise<HybridDashboardProfile> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), organizationId: ORG_ID }),
  });
  return parseJson<HybridDashboardProfile>(response);
}

export async function renameHybridProfile(profileId: string, name: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${profileId}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  });
  await parseJson(response);
}

export async function publishHybridProfile(profileId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${profileId}/publish`, { method: 'POST' });
  await parseJson(response);
}

export async function deleteHybridProfile(profileId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${profileId}`, { method: 'DELETE' });
  await parseJson(response);
}

export async function addHybridStores(storeIds: string[]): Promise<HybridDashboard> {
  const response = await fetch(`${BASE_URL}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: ORG_ID, storeIds }),
  });
  return parseJson<HybridDashboard>(response);
}

export async function removeHybridStore(storeId: string): Promise<HybridDashboard> {
  const response = await fetch(`${BASE_URL}/stores/${storeId}?organizationId=${ORG_ID}`, {
    method: 'DELETE',
  });
  return parseJson<HybridDashboard>(response);
}

export async function updateHybridCell(
  profileId: string,
  storeId: string,
  userIds: string[],
): Promise<HybridDashboard> {
  const response = await fetch(`${BASE_URL}/${profileId}/cell`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, userIds }),
  });
  return parseJson<HybridDashboard>(response);
}

export function buildHybridCellKey(storeId: string, profileId: string) {
  return `${storeId}:${profileId}`;
}
