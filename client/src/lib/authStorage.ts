import {
  getProfileCompletionProgress,
  type ProfileCompletionStatus,
} from "@/lib/profileCompletion";

const GATEWAY = (import.meta.env.VITE_USER_API || '/api/user').replace('/api/user', '').replace(/\/$/, '');

const AUTH_KEYS = [
  "isAuthenticated",
  "accessToken",
  "refreshToken",
  "user",
] as const;

const REMEMBER_PREFERENCE_KEY = "rememberMe";

export type AuthUser = {
  id?: string;
  userId?: string;
  email?: string;
  organizationId?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  entityId?: string;
  storeId?: string;
  storeName?: string;
  manager?: string;
  designation?: string;
  phone?: string;
  mustChangePassword?: boolean;
  passwordExpiringSoon?: boolean;
  daysUntilExpiry?: number | null;
  passwordExpiresAt?: string | null;
  profileSetupComplete?: boolean;
  profileSetupCompletedAt?: string | null;
  profileCompletion?: ProfileCompletionStatus;
  /** 'user' | 'admin' | 'super_admin' — merged from the user profile. */
  role?: string;
  [key: string]: unknown;
};

export function clearMustChangePasswordFlag() {
  updateStoredUser({
    mustChangePassword: false,
    passwordExpiringSoon: false,
    daysUntilExpiry: null,
    passwordExpiresAt: null,
  });
}

/** Profile onboarding complete when required fields are filled. */
export function isProfileSetupComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return getProfileCompletionProgress(user).profileSetupComplete;
}

export function syncProfileCompletionToSession(
  profile: Partial<AuthUser> & {
    profileCompletion?: ProfileCompletionStatus;
    profileSetupComplete?: boolean;
    profileSetupCompletedAt?: string | Date | null;
  },
) {
  const progress = getProfileCompletionProgress({
    name: profile.name,
    fullName: profile.fullName,
    entityId: profile.entityId,
    storeId: profile.storeId,
    storeName: profile.storeName,
    manager: profile.manager,
    profileSetupComplete: profile.profileSetupComplete,
    profileSetupCompletedAt: profile.profileSetupCompletedAt
      ? String(profile.profileSetupCompletedAt)
      : null,
    profileCompletion: profile.profileCompletion,
  });

  return updateStoredUser({
    name: profile.name,
    employeeId: profile.employeeId as string | undefined,
    entityId: profile.entityId,
    storeId: profile.storeId,
    storeName: profile.storeName,
    manager: profile.manager,
    designation: profile.designation,
    phone: profile.phone,
    email: profile.email,
    userId: (profile.userId ?? profile.id) as string | undefined,
    id: (profile.id ?? profile.userId) as string | undefined,
    profileSetupComplete: progress.profileSetupComplete,
    profileSetupCompletedAt: progress.profileSetupCompletedAt,
    profileCompletion: progress,
  });
}

export function updateStoredUser(patch: Partial<AuthUser>) {
  const current = getStoredUser();
  const next = { ...current, ...patch };
  if (patch.userId || patch.id) {
    next.userId = (patch.userId ?? patch.id ?? current.userId ?? current.id) as string;
    next.id = (patch.id ?? patch.userId ?? current.id ?? current.userId) as string;
  }
  const store = getAuthStorage();
  store.setItem("user", JSON.stringify(next));
  return next;
}

function readFromStores(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/** Prefer the store that currently holds the session (local > session). */
export function getAuthStorage(): Storage {
  if (localStorage.getItem("isAuthenticated") || localStorage.getItem("accessToken")) {
    return localStorage;
  }
  if (sessionStorage.getItem("isAuthenticated") || sessionStorage.getItem("accessToken")) {
    return sessionStorage;
  }
  return localStorage.getItem(REMEMBER_PREFERENCE_KEY) === "false"
    ? sessionStorage
    : localStorage;
}

export function getAuthItem(key: (typeof AUTH_KEYS)[number] | string): string | null {
  return readFromStores(key);
}

export function getStoredUser(): AuthUser {
  try {
    return JSON.parse(getAuthItem("user") || "{}") as AuthUser;
  } catch {
    return {};
  }
}

/** Logged-in organization id — never hardcode `default-org` at call sites. */
export function getOrganizationId(fallback = "default-org"): string {
  const id = getStoredUser().organizationId;
  return typeof id === "string" && id.trim() ? id.trim() : fallback;
}

export function getCurrentUserId(): string {
  const user = getStoredUser();
  return String(user.userId ?? user.id ?? "");
}

export function isSuperAdmin(): boolean {
  return getStoredUser().role === "super_admin";
}

export function isAdmin(): boolean {
  const role = getStoredUser().role;
  return role === "admin" || role === "super_admin";
}

export function getRememberMePreference(): boolean {
  const stored = localStorage.getItem(REMEMBER_PREFERENCE_KEY);
  // Default checked when no preference yet (matches prior always-persist behavior).
  return stored !== "false";
}

export function setAuthSession(
  data: {
    accessToken: string;
    refreshToken?: string;
    user: AuthUser;
  },
  rememberMe: boolean,
) {
  const store = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;

  for (const key of AUTH_KEYS) {
    other.removeItem(key);
  }

  store.setItem("isAuthenticated", "true");
  store.setItem("accessToken", data.accessToken);
  if (data.refreshToken) {
    store.setItem("refreshToken", data.refreshToken);
  }
  store.setItem("user", JSON.stringify(data.user));

  // Preference survives logout so the checkbox restores next visit.
  localStorage.setItem(REMEMBER_PREFERENCE_KEY, rememberMe ? "true" : "false");
}

export function clearAuthSession() {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export async function logoutAuthSession() {
  const refreshToken = getAuthItem("refreshToken");

  try {
    const { recordLogoutAttendance } = await import("@/lib/attendanceApi");
    await recordLogoutAttendance();
  } catch (err) {
    console.warn("Failed to record logout attendance:", err);
  }

  clearAuthSession();

  if (!refreshToken) return;

  try {
    await fetch(`${GATEWAY}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    console.error("Failed to revoke refresh token:", err);
  }
}
