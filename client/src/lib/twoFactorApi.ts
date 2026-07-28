import { getAuthItem } from "@/lib/authStorage";

const AUTH_BASE = "http://localhost:3009/api/auth";

export type TwoFactorSettings = {
  enabled: boolean;
};

function authHeaders(json = true): HeadersInit {
  const token = getAuthItem("accessToken");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTwoFactorSettings(): Promise<TwoFactorSettings> {
  const res = await fetch(`${AUTH_BASE}/two-factor-settings`, {
    headers: authHeaders(false),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load two-factor settings");
  }
  return data;
}

export async function updateTwoFactorSettings(enabled: boolean): Promise<TwoFactorSettings> {
  const res = await fetch(`${AUTH_BASE}/two-factor-settings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ enabled }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update two-factor settings");
  }
  return data;
}

export async function verifyLoginOtp(pendingToken: string, otp: string, rememberMe: boolean) {
  const res = await fetch(`${AUTH_BASE}/login/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pendingToken, otp, rememberMe }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Invalid or expired OTP");
  }
  return data;
}

export async function resendLoginOtp(pendingToken: string) {
  const res = await fetch(`${AUTH_BASE}/login/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pendingToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to resend OTP");
  }
  return data;
}
