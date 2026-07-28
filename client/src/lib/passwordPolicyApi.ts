import { getAuthItem } from "@/lib/authStorage";

import { AUTH_API } from './apiConfig';
const AUTH_BASE = AUTH_API;

export type PasswordPolicy = {
  id?: string;
  scopeKey?: string;
  passwordExpiryDays: number;
  warnBeforeExpiryDays: number;
};

export type PasswordRotationStatus = {
  passwordChangedAt: string | null;
  passwordExpiryDays: number;
  warnBeforeExpiryDays: number;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  mustChangePassword: boolean;
  passwordExpiringSoon: boolean;
};

function authHeaders(json = true): HeadersInit {
  const token = getAuthItem("accessToken");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPasswordPolicy(): Promise<PasswordPolicy> {
  const res = await fetch(`${AUTH_BASE}/password-policy`);
  if (!res.ok) {
    throw new Error("Failed to load password policy");
  }
  return res.json();
}

export async function updatePasswordPolicy(
  body: Partial<Pick<PasswordPolicy, "passwordExpiryDays" | "warnBeforeExpiryDays">>,
): Promise<PasswordPolicy> {
  const res = await fetch(`${AUTH_BASE}/password-policy`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to save password policy");
  }
  return data;
}

export async function fetchPasswordRotationStatus(): Promise<PasswordRotationStatus> {
  const res = await fetch(`${AUTH_BASE}/password-rotation-status`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error("Failed to load password rotation status");
  }
  return res.json();
}
