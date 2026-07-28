import { getStoredUser, getOrganizationId } from '@/lib/authStorage';
import { formatDateTimeLong } from '@/lib/formatDateTime';

const AUDIT_API = import.meta.env.VITE_AUDIT_API || '/api/audit-logs';

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
  category?: 'workflow' | 'system';
};

export type AuditLogResponse = {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HIDDEN_DETAIL_KEYS = new Set([
  'id',
  'formid',
  'submissionid',
  'roleid',
  'featureid',
  'targetid',
  'designationid',
  'userid',
  'organizationid',
  'workflowid',
  'addedfeatureids',
  'removedfeatureids',
  'entity',
  'changedfields',
]);

const DETAIL_LABELS: Record<string, string> = {
  title: 'Title',
  workflowtype: 'Type',
  status: 'Status',
  email: 'Email',
  name: 'Name',
  storename: 'Store',
  storestatus: 'Store status',
  profilesetupcomplete: 'Profile setup',
  rolename: 'Role',
  featurename: 'Feature',
  permissionlevel: 'Permission',
  previouspermissionlevel: 'Previous permission',
  action: 'Action',
  source: 'Source',
  designationname: 'Designation',
  designation: 'Designation',
  addedfeaturenames: 'Added features',
  removedfeaturenames: 'Removed features',
  priority: 'Priority',
  category: 'Category',
  employeeid: 'Employee ID',
};

function isHiddenDetailKey(key: string) {
  const normalized = key.toLowerCase();
  if (HIDDEN_DETAIL_KEYS.has(normalized)) return true;
  if (normalized.endsWith('id') || normalized.endsWith('ids')) return true;
  return false;
}

function formatDetailLabel(key: string) {
  const normalized = key.toLowerCase();
  if (DETAIL_LABELS[normalized]) return DETAIL_LABELS[normalized];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatDetailValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatDetailValue(item))
      .filter((item): item is string => Boolean(item));
    return items.length ? items.join(', ') : null;
  }
  const text = typeof value === 'string' ? value.trim() : JSON.stringify(value);
  if (!text || UUID_PATTERN.test(text)) return null;
  if (text === 'process') return 'Process';
  if (text === 'audit') return 'Audit';
  return text;
}

export function formatAuditLogTarget(log: Pick<AuditLogRecord, 'target' | 'details'>) {
  if (log.target === 'Form Submission') {
    const workflowType = String(log.details?.workflowType || '').toLowerCase();
    if (workflowType === 'audit') return 'Audit';
    if (workflowType === 'process') return 'Process';
    return 'Form';
  }
  if (log.target === 'FeaturePermission') return 'Permission';
  if (log.target === 'User') return 'User';
  if (log.target === 'ActionPoint') return 'Action Point';
  if (log.target === 'BusinessEntity') return 'Entity';
  if (log.target === 'AttendanceRecord') return 'Attendance';
  if (log.target === 'NoticeboardPost' || log.target === 'Noticeboard' || log.target === 'Notice') {
    return 'Notice';
  }
  return log.target;
}

export function formatAuditLogDetails(details?: Record<string, unknown>) {
  if (!details || Object.keys(details).length === 0) return '-';

  const parts = Object.entries(details)
    .filter(([key]) => !isHiddenDetailKey(key))
    .map(([key, value]) => {
      const formatted = formatDetailValue(value);
      if (!formatted) return null;
      return `${formatDetailLabel(key)}: ${formatted}`;
    })
    .filter((part): part is string => Boolean(part));

  return parts.length ? parts.join(', ') : '-';
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
  if (query.category) params.set('category', query.category);

  const response = await fetch(`${AUDIT_API}?${params}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Failed to fetch audit logs (${response.status})`);
  }
  return data as AuditLogResponse;
}

export async function fetchAllAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogRecord[]> {
  const logs: AuditLogRecord[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchAuditLogs({
      ...query,
      page,
      limit: 100,
    });
    logs.push(...result.logs);
    hasMore = result.hasMore;
    page += 1;
  }

  return logs;
}

function formatCreatedAtForExport(value: string) {
  return formatDateTimeLong(value);
}

export function exportAuditLogsToCsv(
  logs: AuditLogRecord[],
  filenamePrefix = 'audit-report',
) {
  const headers = ['Target', 'Operation', 'Performed By', 'Details', 'Created At'];
  const rows = logs.map((log) => [
    formatAuditLogTarget(log),
    log.operation,
    log.performedBy,
    formatAuditLogDetails(log.details),
    formatCreatedAtForExport(log.createdAt),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
