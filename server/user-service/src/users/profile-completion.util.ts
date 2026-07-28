import { UserProfile } from '../profiles/user-profile.entity';

export type ProfileCompletionItem = {
  key: 'name' | 'store' | 'manager';
  label: string;
  done: boolean;
};

export type ProfileCompletionStatus = {
  profileSetupComplete: boolean;
  profileSetupCompletedAt: string | null;
  percent: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
};

/** Required onboarding fields: name, store (entity/store). Reporting manager is optional. */
export function isProfileFieldsComplete(
  profile: Partial<Pick<UserProfile, 'name' | 'entityId' | 'storeId' | 'storeName' | 'manager'>>,
): boolean {
  const name = String(profile?.name || '').trim();
  const store = String(profile?.entityId || profile?.storeId || profile?.storeName || '').trim();
  return Boolean(name && store);
}

export function buildProfileCompletionStatus(
  profile: Partial<UserProfile> | null | undefined,
): ProfileCompletionStatus {
  const nameDone = Boolean(String(profile?.name || '').trim());
  const storeDone = Boolean(
    String(profile?.entityId || profile?.storeId || profile?.storeName || '').trim(),
  );
  const managerDone = Boolean(String(profile?.manager || '').trim());
  const items: ProfileCompletionItem[] = [
    { key: 'name', label: 'Full name', done: nameDone },
    { key: 'store', label: 'Store / entity', done: storeDone },
    { key: 'manager', label: 'Reporting manager (optional)', done: managerDone },
  ];
  const completedCount = items.filter((i) => i.done && i.key !== 'manager').length;
  const totalCount = items.filter((i) => i.key !== 'manager').length;
  const profileSetupComplete = nameDone && storeDone;
  return {
    profileSetupComplete,
    profileSetupCompletedAt: profile?.profileSetupCompletedAt
      ? new Date(profile.profileSetupCompletedAt).toISOString()
      : null,
    percent: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    items,
  };
}

export function completionTrackingFields(
  profile: Partial<UserProfile>,
  previousCompletedAt?: Date | null,
): Pick<UserProfile, 'profileSetupComplete' | 'profileSetupCompletedAt'> {
  const complete = isProfileFieldsComplete(profile);
  return {
    profileSetupComplete: complete,
    profileSetupCompletedAt: complete
      ? previousCompletedAt || profile.profileSetupCompletedAt || new Date()
      : null,
  };
}
