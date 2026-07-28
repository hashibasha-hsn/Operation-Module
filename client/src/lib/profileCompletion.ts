import { USER_API } from './apiConfig';

export type ProfileCompletionItem = {
  key: "name" | "store" | "manager";
  label: string;
  done: boolean;
};

export type ProfileCompletionStatus = {
  profileSetupComplete: boolean;
  profileSetupCompletedAt?: string | null;
  percent: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
};

type ProfileLike = {
  name?: string | null;
  fullName?: string | null;
  entityId?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  manager?: string | null;
  profileSetupComplete?: boolean;
  profileSetupCompletedAt?: string | Date | null;
  profileCompletion?: ProfileCompletionStatus;
};

/** Build live completion tracking from profile fields (source of truth). */
export function getProfileCompletionProgress(
  user: ProfileLike | null | undefined,
): ProfileCompletionStatus {
  if (user?.profileCompletion && typeof user.profileCompletion.percent === "number") {
    return user.profileCompletion;
  }

  const nameDone = Boolean(String(user?.name || user?.fullName || "").trim());
  const storeDone = Boolean(
    String(user?.entityId || user?.storeId || user?.storeName || "").trim(),
  );
  const managerDone = Boolean(String(user?.manager || "").trim());
  const items: ProfileCompletionItem[] = [
    { key: "name", label: "Full name", done: nameDone },
    { key: "store", label: "Store / entity", done: storeDone },
    { key: "manager", label: "Reporting manager (optional)", done: managerDone },
  ];
  const completedCount = items.filter((i) => i.done && i.key !== "manager").length;
  const totalCount = items.filter((i) => i.key !== "manager").length;
  const profileSetupComplete = nameDone && storeDone;

  return {
    profileSetupComplete,
    profileSetupCompletedAt: user?.profileSetupCompletedAt
      ? new Date(user.profileSetupCompletedAt).toISOString()
      : null,
    percent: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    items,
  };
}

export async function fetchProfileCompletion(
  userId: string,
): Promise<ProfileCompletionStatus | null> {
  try {
    const res = await fetch(
      `${USER_API}/users/${userId}/profile-completion`,
    );
    if (!res.ok) return null;
    return (await res.json()) as ProfileCompletionStatus;
  } catch {
    return null;
  }
}
