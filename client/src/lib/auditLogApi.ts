const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export type AuditLogRecord = {
  id: string;
  target: string;
  operation: string;
  performedBy: string;
  details?: Record<string, unknown>;
  targetId?: string;
  organizationId: string;
  createdAt: string;
};

export type AuditLogQuery = {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  target?: string;
  operation?: string;
  performedBy?: string;
  details?: string;
  sort?: 'asc' | 'desc';
};

export type AuditLogResponse = {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

function getOrganizationId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.organizationId || 'default-org';
  } catch {
    return 'default-org';
  }
}

export async function fetchAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogResponse> {
  const params = new URLSearchParams({
    organizationId: query.organizationId || getOrganizationId(),
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 20),
    sort: query.sort ?? 'desc',
  });
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.target) params.set('target', query.target);
  if (query.operation) params.set('operation', query.operation);
  if (query.performedBy) params.set('performedBy', query.performedBy);
  if (query.details) params.set('details', query.details);

  const response = await fetch(`${ORG_API}/audit-logs?${params}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Failed to fetch audit logs (${response.status})`);
  }
  return data as AuditLogResponse;
}

export function formatAuditLogDetails(details?: Record<string, unknown>) {
  if (!details || Object.keys(details).length === 0) return '-';
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}`)
    .join(', ');
}

export function exportAuditLogsToCsv(logs: AuditLogRecord[]) {
  const headers = ['Target', 'Operation', 'Performed By', 'Details', 'Created At'];
  const rows = logs.map((log) => [
    log.target,
    log.operation,
    log.performedBy,
    formatAuditLogDetails(log.details),
    log.createdAt,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
