const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'on_hold'
  | 'complete'
  | 'closed'
  | 'rejected';

export type TicketPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

export type TicketRecord = {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  dueDate?: string;
  storeId: string;
  assignedTo: string;
  createdBy: string;
  categoryId?: string;
  ticketType: 'custom' | 'auto';
  tags?: Record<string, unknown>;
  attachments?: unknown[];
  comments?: Array<{ text: string; userId: string; userName?: string; timestamp: string }>;
  actionHistory?: unknown[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

function getContext() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      organizationId: user.organizationId || 'default-org',
      userId: user.userId ?? user.id ?? '',
      userName: user.fullName || user.name || user.email || 'User',
    };
  } catch {
    return { organizationId: 'default-org', userId: '', userName: 'User' };
  }
}

async function ticketRequest<T>(
  path: string,
  init?: RequestInit,
  attempt = 0,
): Promise<T> {
  const response = await fetch(`${ORG_API}${path}`, init);
  const data = await response.json().catch(() => null);

  if (
    !response.ok &&
    attempt < 2 &&
    [502, 503, 504].includes(response.status)
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return ticketRequest<T>(path, init, attempt + 1);
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Attachment too large. Please use files under 5 MB.');
    }
    if (response.status === 504) {
      throw new Error(
        'Request timed out. The server may be restarting — please try again.',
      );
    }
    throw new Error(data?.message || `Ticket request failed (${response.status})`);
  }

  return data as T;
}

export async function fetchAllTickets(startDate?: string, endDate?: string) {
  const { organizationId } = getContext();
  const params = new URLSearchParams({ organizationId });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return ticketRequest<TicketRecord[]>(`/tickets?${params}`);
}

export async function fetchTicketsAssignedToMe() {
  const { organizationId, userId } = getContext();
  return ticketRequest<TicketRecord[]>(
    `/tickets/assigned-to-me?userId=${encodeURIComponent(userId)}&organizationId=${organizationId}`,
  );
}

export async function fetchTicketsCreatedByMe() {
  const { organizationId, userId } = getContext();
  return ticketRequest<TicketRecord[]>(
    `/tickets/created-by-me?userId=${encodeURIComponent(userId)}&organizationId=${organizationId}`,
  );
}

export async function fetchTicketById(id: string) {
  return ticketRequest<TicketRecord>(`/tickets/${id}`);
}

export async function createTicket(payload: Partial<TicketRecord>) {
  const { organizationId, userId, userName } = getContext();
  return ticketRequest<TicketRecord>('/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'open',
      priority: 'medium',
      ticketType: 'custom',
      ...payload,
      organizationId: payload.organizationId || organizationId,
      createdBy: payload.createdBy || userName || userId,
    }),
  });
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { userId } = getContext();
  return ticketRequest<TicketRecord>(`/tickets/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, userId }),
  });
}

export async function addTicketComment(id: string, text: string) {
  const { userId, userName } = getContext();
  return ticketRequest<TicketRecord>(`/tickets/${id}/comments`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function deleteTicket(id: string) {
  const { userId } = getContext();
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return ticketRequest<void>(`/tickets/${id}${params}`, { method: 'DELETE' });
}

export async function fetchTicketTags() {
  const { organizationId } = getContext();
  return ticketRequest<any[]>(`/tickets/tags?organizationId=${organizationId}`);
}

export async function createTicketTag(payload: Record<string, unknown>) {
  const { organizationId } = getContext();
  return ticketRequest<any>('/tickets/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId }),
  });
}

export async function updateTicketTag(id: string, payload: Record<string, unknown>) {
  return ticketRequest<any>(`/tickets/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteTicketTag(id: string) {
  return ticketRequest<void>(`/tickets/tags/${id}`, { method: 'DELETE' });
}

export async function fetchTicketCategories() {
  const { organizationId } = getContext();
  return ticketRequest<any[]>(`/tickets/categories?organizationId=${organizationId}`);
}

export async function createTicketCategory(payload: Record<string, unknown>) {
  const { organizationId } = getContext();
  return ticketRequest<any>('/tickets/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId }),
  });
}

export async function updateTicketCategory(id: string, payload: Record<string, unknown>) {
  return ticketRequest<any>(`/tickets/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteTicketCategory(id: string) {
  return ticketRequest<void>(`/tickets/categories/${id}`, { method: 'DELETE' });
}

export async function fetchTicketRules() {
  const { organizationId } = getContext();
  return ticketRequest<any[]>(`/tickets/rules?organizationId=${organizationId}`);
}

export async function createTicketRule(payload: Record<string, unknown>) {
  const { organizationId } = getContext();
  return ticketRequest<any>('/tickets/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId }),
  });
}

export async function updateTicketRule(id: string, payload: Record<string, unknown>) {
  return ticketRequest<any>(`/tickets/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteTicketRule(id: string) {
  return ticketRequest<void>(`/tickets/rules/${id}`, { method: 'DELETE' });
}

export async function fetchTicketSettings() {
  const { organizationId } = getContext();
  return ticketRequest<any>(`/tickets/settings?organizationId=${organizationId}`);
}

export async function updateTicketSettings(payload: Record<string, unknown>) {
  const { organizationId } = getContext();
  return ticketRequest<any>('/tickets/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId }),
  });
}

export async function fetchTicketOrgReport(startDate?: string, endDate?: string) {
  const { organizationId } = getContext();
  const params = new URLSearchParams({ organizationId });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return ticketRequest<any>(`/tickets/reports/org-report?${params}`);
}

export async function fetchTicketAdvanceSearch(filters: Record<string, unknown>) {
  const { organizationId } = getContext();
  return ticketRequest<TicketRecord[]>(
    `/tickets/reports/advance-search?organizationId=${organizationId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    },
  );
}

export async function fetchTicketTagReport(tagId?: string) {
  const { organizationId } = getContext();
  const params = new URLSearchParams({ organizationId });
  if (tagId) params.set('tagId', tagId);
  return ticketRequest<any>(`/tickets/reports/tag-report?${params}`);
}

export function exportTicketsToCsv(
  tickets: TicketRecord[],
  columns: string[],
  filename = 'tickets.csv',
) {
  const headers = columns;
  const rows = tickets.map((ticket) =>
    columns.map((col) => {
      const value = (ticket as Record<string, unknown>)[col];
      if (value == null) return '';
      return String(value);
    }),
  );

  const escape = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function isTicketOverdue(ticket: TicketRecord) {
  if (!ticket.dueDate) return false;
  if (['complete', 'closed'].includes(ticket.status)) return false;
  return new Date(ticket.dueDate).getTime() < Date.now();
}

export function isTicketDueToday(ticket: TicketRecord) {
  if (!ticket.dueDate) return false;
  const due = new Date(ticket.dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isTicketOnTime(ticket: TicketRecord) {
  if (!ticket.dueDate) return true;
  if (['complete', 'closed'].includes(ticket.status)) {
    const completedAt = ticket.actionHistory?.find(
      (entry: any) => entry?.to === 'complete' || entry?.to === 'closed',
    ) as { timestamp?: string } | undefined;
    if (completedAt?.timestamp) {
      return new Date(completedAt.timestamp).getTime() <= new Date(ticket.dueDate).getTime();
    }
  }
  return !isTicketOverdue(ticket);
}
