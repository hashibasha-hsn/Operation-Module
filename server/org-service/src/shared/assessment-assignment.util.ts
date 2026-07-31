import { Assessment } from '../assessments/assessment.entity';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

type OrgUser = {
  userId: string;
  entityId?: string | null;
  storeId?: string | null;
  designation?: string | null;
};

export async function fetchOrgUsers(): Promise<OrgUser[]> {
  try {
    const response = await fetch(`${USER_SERVICE_URL}/users?limit=1000`);
    if (!response.ok) return [];
    const data = await response.json();
    const rows = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
    return rows
      .map((row: any) => ({
        userId: String(row.userId ?? row.id ?? ''),
        entityId: row.entityId ?? null,
        storeId: row.storeId ?? null,
        designation: row.designation ?? null,
      }))
      .filter((row) => row.userId);
  } catch {
    return [];
  }
}

export async function fetchUsersFromAssigneeProfiles(profileIds: string[]): Promise<string[]> {
  const userIds = new Set<string>();
  for (const profileId of profileIds) {
    try {
      const response = await fetch(`${USER_SERVICE_URL}/tags/assignee-profile/${profileId}`);
      if (!response.ok) continue;
      const profile = await response.json();
      for (const user of profile.users ?? []) {
        const userId = String(user.userId ?? user.id ?? '');
        if (userId) userIds.add(userId);
      }
    } catch {
      // ignore profile lookup failures
    }
  }
  return [...userIds];
}

export async function resolveAssessmentAssigneeUserIds(assessment: Assessment): Promise<string[]> {
  const userIds = new Set<string>((assessment.assigneeIds ?? []).map(String));
  const storeIds = new Set((assessment.storeIds ?? []).map(String));
  const profiles = (assessment.assigneeProfiles ?? {}) as {
    profileIds?: string[];
    designationNames?: string[];
  };

  if (storeIds.size || profiles.designationNames?.length) {
    const users = await fetchOrgUsers();
    for (const user of users) {
      if (storeIds.has(String(user.entityId ?? '')) || storeIds.has(String(user.storeId ?? ''))) {
        userIds.add(user.userId);
      }
      if (profiles.designationNames?.length && user.designation) {
        const designation = user.designation.toLowerCase();
        if (profiles.designationNames.some((name) => name.toLowerCase() === designation)) {
          userIds.add(user.userId);
        }
      }
    }
  }

  if (profiles.profileIds?.length) {
    for (const id of await fetchUsersFromAssigneeProfiles(profiles.profileIds)) {
      userIds.add(id);
    }
  }

  return [...userIds];
}

export function getNotifiedAssigneeIds(assessment: Assessment): Set<string> {
  const raw = assessment.properties?.notifiedAssigneeIds;
  return new Set(Array.isArray(raw) ? raw.map(String) : []);
}

export function mergeNotifiedAssigneeIds(
  assessment: Assessment,
  userIds: string[],
): Record<string, unknown> {
  const next = new Set([...getNotifiedAssigneeIds(assessment), ...userIds.map(String)]);
  return {
    ...(assessment.properties ?? {}),
    notifiedAssigneeIds: [...next],
  };
}
