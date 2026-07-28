import { getAuthItem } from "@/lib/authStorage";

const NOTIFICATION_BASE = "http://localhost:3009/api/notification";

export type EmailConfig = {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
  hasPassword?: boolean;
  updatedAt?: string;
};

function authHeaders(): HeadersInit {
  const token = getAuthItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchEmailConfig(): Promise<EmailConfig> {
  const res = await fetch(`${NOTIFICATION_BASE}/email/config`);
  if (!res.ok) {
    throw new Error("Failed to load email configuration");
  }
  return res.json();
}

export async function updateEmailConfig(
  body: Partial<EmailConfig>,
): Promise<EmailConfig> {
  const res = await fetch(`${NOTIFICATION_BASE}/email/config`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Failed to save email configuration");
  }
  return data;
}

export async function sendTestEmail(to: string) {
  const res = await fetch(`${NOTIFICATION_BASE}/email/config/test`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ to }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || "Failed to send test email");
  }
  return data;
}
