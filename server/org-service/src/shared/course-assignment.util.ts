import { fetchOrgUsers, fetchUsersFromAssigneeProfiles } from './assessment-assignment.util';

type CourseAssignment = {
  assigneeIds?: string[];
  storeIds?: string[];
  assigneeProfiles?: Record<string, unknown> | null;
};

export async function resolveCourseAssigneeUserIds(course: CourseAssignment): Promise<string[]> {
  const userIds = new Set<string>((course.assigneeIds ?? []).map(String));
  const storeIds = new Set((course.storeIds ?? []).map(String));
  const profiles = (course.assigneeProfiles ?? {}) as {
    profileIds?: string[];
    designationNames?: string[];
  };

  if (storeIds.size) {
    const users = await fetchOrgUsers();
    for (const user of users) {
      if (storeIds.has(String(user.entityId ?? '')) || storeIds.has(String(user.storeId ?? ''))) {
        userIds.add(user.userId);
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
