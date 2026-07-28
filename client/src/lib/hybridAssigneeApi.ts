import { getOrganizationId } from '@/lib/authStorage';
const BASE_URL = (import.meta.env.VITE_USER_API || 'http://localhost:3009/api/user') + '/hybrid-assignee-profiles';

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
  const response = await fetch(`${BASE_URL}/dashboard?organizationId=${encodeURIComponent(getOrganizationId())}`);
  return parseJson<HybridDashboard>(response);
}

export async function createHybridProfile(name: string): Promise<HybridDashboardProfile> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), organizationId: getOrganizationId() }),
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
    body: JSON.stringify({ organizationId: getOrganizationId(), storeIds }),
  });
  return parseJson<HybridDashboard>(response);
}

export async function removeHybridStore(storeId: string): Promise<HybridDashboard> {
  const response = await fetch(`${BASE_URL}/stores/${storeId}?organizationId=${encodeURIComponent(getOrganizationId())}`, {
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
