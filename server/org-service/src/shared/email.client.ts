import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3016';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

async function resolveUserEmail(userId: string): Promise<string | null> {
  if (!userId) return null;
  if (userId.includes('@')) return userId;
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/users/${encodeURIComponent(userId)}`,
      { timeout: 3000 },
    );
    const email = response.data?.email?.trim();
    return email || null;
  } catch (error) {
    console.warn('[email-client] failed to resolve user email', userId, error);
    return null;
  }
}

export async function emailProcessAssigned(input: {
  userId: string;
  processTitle: string;
  processId: string;
  assignedBy?: string;
}): Promise<void> {
  try {
    const to = await resolveUserEmail(input.userId);
    if (!to) {
      console.warn('[email-client] skipping email: no address for user', input.userId);
      return;
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_SERVICE_TOKEN) {
      headers['x-service-token'] = INTERNAL_SERVICE_TOKEN;
    }
    await axios.post(
      `${EMAIL_SERVICE_URL}/email/process-assigned`,
      {
        to,
        processTitle: input.processTitle,
        processId: input.processId,
        assignedBy: input.assignedBy ?? null,
      },
      { headers, timeout: 5000 },
    );
  } catch (error: any) {
    console.warn(
      '[email-client] failed to send process-assigned email',
      input.userId,
      error?.response?.status || error?.message || error,
    );
  }
}
