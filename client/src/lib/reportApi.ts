const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'quarter';

export function getReportContext() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      organizationId: user.organizationId || 'default-org',
      userId: user.userId ?? user.id ?? '',
      userName: user.name ?? user.fullName ?? user.email ?? '',
    };
  } catch {
    return { organizationId: 'default-org', userId: '', userName: '' };
  }
}

export function getDateRange(filter: DateFilter): { startDate?: string; endDate?: string } {
  if (filter === 'all') return {};
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);

  if (filter === 'today') {
    return { startDate: endDate, endDate };
  }
  if (filter === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString().slice(0, 10), endDate };
  }
  if (filter === 'month') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString().slice(0, 10), endDate };
  }
  const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString().slice(0, 10), endDate };
}

function withDateParams(base: URLSearchParams, filter: DateFilter) {
  const { startDate, endDate } = getDateRange(filter);
  if (startDate) base.set('startDate', startDate);
  if (endDate) base.set('endDate', endDate);
  return base;
}

async function orgGet<T>(path: string, params?: URLSearchParams): Promise<T> {
  const query = params?.toString();
  const url = query ? `${ORG_API}${path}?${query}` : `${ORG_API}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Report request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchMyReport(dateFilter: DateFilter = 'all') {
  const { organizationId, userId } = getReportContext();
  const params = withDateParams(
    new URLSearchParams({ userId, organizationId }),
    dateFilter,
  );
  return orgGet<any[]>(`/submissions/reports/my-report`, params);
}

export async function fetchStoreReport(storeId: string, dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(
    new URLSearchParams({ storeId, organizationId }),
    dateFilter,
  );
  return orgGet<any[]>(`/submissions/reports/store-report`, params);
}

export async function fetchProcessReport(processId: string, dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(
    new URLSearchParams({ processId, organizationId }),
    dateFilter,
  );
  return orgGet<any[]>(`/submissions/reports/process-report`, params);
}

export async function fetchOrganizationReport(dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId }), dateFilter);
  return orgGet<any[]>(`/submissions/reports/organization-report`, params);
}

export async function fetchVisualReport(dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId }), dateFilter);
  return orgGet<any>(`/submissions/reports/visual-report`, params);
}

export async function fetchExecutiveDashboard(
  tab: string,
  options: {
    startDate?: string;
    endDate?: string;
    tagFilter?: string;
    metricType?: 'count' | 'percentage';
    periodicity?: 'daily' | 'weekly' | 'monthly';
    viewType?: 'completion' | 'compliance';
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.tagFilter) params.set('tagFilter', options.tagFilter);
  if (options.metricType) params.set('metricType', options.metricType);
  if (options.periodicity) params.set('periodicity', options.periodicity);
  if (options.viewType) params.set('viewType', options.viewType);

  const endpoints: Record<string, string> = {
    'org-summary': '/executive-dashboard/org-summary',
    'all-stores': '/executive-dashboard/all-stores',
    'heat-map': '/executive-dashboard/heat-map',
    snapshot: '/executive-dashboard/snapshot',
    'process-tag-insights': '/executive-dashboard/process-tag-insights',
  };

  const path = endpoints[tab] ?? endpoints['org-summary'];
  return orgGet<any>(path, params);
}

export async function fetchEntities() {
  const { organizationId } = getReportContext();
  const data = await orgGet<any[]>(
    `/entities`,
    new URLSearchParams({ organizationId }),
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchPublishedProcesses() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/processes/published/list`, new URLSearchParams({ organizationId }));
}

export async function fetchActionPoints() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/action-points`, new URLSearchParams({ organizationId }));
}

export async function fetchTickets() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/tickets`, new URLSearchParams({ organizationId }));
}

export async function fetchAssets() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/assets`, new URLSearchParams({ organizationId }));
}

export async function fetchAssessments() {
  return orgGet<any[]>(`/assessments`, new URLSearchParams({ organizationId: getReportContext().organizationId }));
}

export async function fetchLearningOrgReport(dateFilter: DateFilter = 'all', tab = 'courses') {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId, tab }), dateFilter);
  return orgGet<any>(`/courses/reports/org-report`, params);
}

export async function fetchAssessmentOrgReport(dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId }), dateFilter);
  return orgGet<any[]>(`/assessments/reports/org-report`, params);
}

export async function fetchAssessmentResultsReport(dateFilter: DateFilter = 'all') {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId }), dateFilter);
  return orgGet<any[]>(`/assessments/reports/results`, params);
}

export function exportRowsToCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
