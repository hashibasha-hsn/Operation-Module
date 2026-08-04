import { getAuthItem } from "@/lib/authStorage";
import { GATEWAY } from "@/lib/apiConfig";

const SNAPSHOT_BASE = `${GATEWAY}/api/email/snapshot`;

export interface SnapshotEmailConfig {
  id?: string;
  organizationId?: string;
  enabled: boolean;
  frequency: string;
  timeOfDay: string;
  recipients: string;
  snapshotDate?: string | null;
  lastSentAt?: string | null;
}

function authHeaders(): HeadersInit {
  const token = getAuthItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSnapshotConfig(organizationId: string): Promise<SnapshotEmailConfig> {
  const res = await fetch(`${SNAPSHOT_BASE}/config?organizationId=${encodeURIComponent(organizationId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || err?.error || "Failed to load snapshot email config");
  }
  const data = await res.json();
  return data ?? {};
}

export async function saveSnapshotConfig(organizationId: string, config: Partial<SnapshotEmailConfig>): Promise<SnapshotEmailConfig> {
  const res = await fetch(`${SNAPSHOT_BASE}/config?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(config),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "Failed to save snapshot email config");
  return data;
}

export async function sendSnapshotEmail(organizationId: string, date?: string) {
  const res = await fetch(`${SNAPSHOT_BASE}/send?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "Failed to send snapshot email");
  return data;
}

export async function sendSnapshotTestEmail(organizationId: string, to: string) {
  const res = await fetch(`${SNAPSHOT_BASE}/test?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ to }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "Failed to send snapshot test email");
  return data;
}