import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';

export type ReportDateOptions = {
  dateFilter?: DateFilter;
  startDate?: string;
  endDate?: string;
};

export function getReportContext() {
  const user = getStoredUser();
  return {
    organizationId: getOrganizationId(),
    userId: (user.userId ?? user.id ?? '') as string,
    userName: (user.name ?? user.fullName ?? user.email ?? '') as string,
  };
}

export function getDateRange(filter: DateFilter): { startDate?: string; endDate?: string } {
  if (filter === 'all' || filter === 'custom') return {};
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

export function resolveReportDateRange(
  options: ReportDateOptions = {},
): { startDate?: string; endDate?: string } {
  if (options.startDate || options.endDate) {
    return {
      startDate: options.startDate,
      endDate: options.endDate,
    };
  }
  return getDateRange(options.dateFilter ?? 'all');
}

function withDateParams(base: URLSearchParams, filter: DateFilter) {
  const { startDate, endDate } = getDateRange(filter);
  if (startDate) base.set('startDate', startDate);
  if (endDate) base.set('endDate', endDate);
  return base;
}

function withReportDateParams(base: URLSearchParams, options: ReportDateOptions = {}) {
  const { startDate, endDate } = resolveReportDateRange(options);
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

export async function fetchMyReport(
  dateFilterOrOptions: DateFilter | ReportDateOptions = 'all',
) {
  const options: ReportDateOptions =
    typeof dateFilterOrOptions === 'string'
      ? { dateFilter: dateFilterOrOptions }
      : dateFilterOrOptions;

  const { organizationId, userId } = getReportContext();
  const params = withReportDateParams(
    new URLSearchParams({ userId, organizationId }),
    options,
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

export async function fetchProcessReport(
  processId: string,
  dateFilter: DateFilter = 'all',
  options: {
    storeId?: string;
    submittedBy?: string;
    status?: string;
    search?: string;
    includeAllStatuses?: boolean;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = withDateParams(
    new URLSearchParams({
      processId: processId || 'all',
      organizationId,
    }),
    dateFilter,
  );
  if (options.storeId && options.storeId !== 'all') params.set('storeId', options.storeId);
  if (options.submittedBy && options.submittedBy !== 'all') params.set('submittedBy', options.submittedBy);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.includeAllStatuses === false) params.set('includeAllStatuses', 'false');
  return orgGet<any>(`/submissions/reports/process-report`, params);
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

export type ExecutiveFilters = {
  startDate?: string;
  endDate?: string;
  tagFilter?: string;
  metricType?: 'count' | 'percentage';
  periodicity?: 'daily' | 'weekly' | 'monthly';
  viewType?: 'completion' | 'compliance';
  region?: string;
  brand?: string;
  department?: string;
  storeId?: string;
  processId?: string;
  date?: string;
  dimension?: 'region' | 'brand' | 'department' | 'processTag';
};

function withExecutiveParams(options: ExecutiveFilters = {}) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.tagFilter && options.tagFilter !== 'all') params.set('tagFilter', options.tagFilter);
  if (options.metricType) params.set('metricType', options.metricType);
  if (options.periodicity) params.set('periodicity', options.periodicity);
  if (options.viewType) params.set('viewType', options.viewType);
  if (options.region && options.region !== 'all') params.set('region', options.region);
  if (options.brand && options.brand !== 'all') params.set('brand', options.brand);
  if (options.department && options.department !== 'all') params.set('department', options.department);
  if (options.storeId) params.set('storeId', options.storeId);
  if (options.processId) params.set('processId', options.processId);
  if (options.date) params.set('date', options.date);
  if (options.dimension) params.set('dimension', options.dimension);
  return params;
}

export async function fetchExecutiveFilterOptions() {
  const { organizationId } = getReportContext();
  return orgGet<any>(
    `/executive-dashboard/filter-options`,
    new URLSearchParams({ organizationId }),
  );
}

export async function fetchExecutiveStoreDetail(
  storeId: string,
  options: ExecutiveFilters = {},
) {
  const params = withExecutiveParams(options);
  return orgGet<any>(`/executive-dashboard/store-detail/${encodeURIComponent(storeId)}`, params);
}

export async function fetchExecutiveDashboard(
  tab: string,
  options: ExecutiveFilters = {},
) {
  const params = withExecutiveParams(options);

  const endpoints: Record<string, string> = {
    overview: '/executive-dashboard/overview',
    'org-summary': '/executive-dashboard/org-summary',
    'all-stores': '/executive-dashboard/all-stores',
    'heat-map': '/executive-dashboard/heat-map',
    snapshot: '/executive-dashboard/snapshot',
    'process-tag-insights': '/executive-dashboard/process-tag-insights',
    'tag-analysis': '/executive-dashboard/tag-analysis',
  };

  const path = endpoints[tab] ?? endpoints.overview;
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

export async function fetchActionPointsOrgReport(
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    storeId?: string;
    assignedTo?: string;
    search?: string;
    dateFilter?: DateFilter;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  const range = options.dateFilter ? getDateRange(options.dateFilter) : {};
  const startDate = options.startDate || range.startDate;
  const endDate = options.endDate || range.endDate;
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.priority && options.priority !== 'all') params.set('priority', options.priority);
  if (options.storeId && options.storeId !== 'all') params.set('storeId', options.storeId);
  if (options.assignedTo && options.assignedTo !== 'all') params.set('assignedTo', options.assignedTo);
  if (options.search) params.set('search', options.search);
  return orgGet<any>(`/action-points/reports/org-report`, params);
}

export async function fetchActionPointsAdvanceReport(
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
    actionPointId?: string;
    dateFilter?: DateFilter;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  const range = options.dateFilter ? getDateRange(options.dateFilter) : {};
  const startDate = options.startDate || range.startDate;
  const endDate = options.endDate || range.endDate;
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.actionPointId) params.set('actionPointId', options.actionPointId);
  return orgGet<any>(`/action-points/reports/advance-report`, params);
}

export async function fetchTicketOrgReport(
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    storeId?: string;
    assignedTo?: string;
    categoryId?: string;
    vendor?: string;
    search?: string;
    dateFilter?: DateFilter;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  const range = options.dateFilter ? getDateRange(options.dateFilter) : {};
  const startDate = options.startDate || range.startDate;
  const endDate = options.endDate || range.endDate;
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.priority && options.priority !== 'all') params.set('priority', options.priority);
  if (options.storeId && options.storeId !== 'all') params.set('storeId', options.storeId);
  if (options.assignedTo && options.assignedTo !== 'all') params.set('assignedTo', options.assignedTo);
  if (options.categoryId && options.categoryId !== 'all') params.set('categoryId', options.categoryId);
  if (options.vendor && options.vendor !== 'all') params.set('vendor', options.vendor);
  if (options.search) params.set('search', options.search);
  return orgGet<any>(`/tickets/reports/org-report`, params);
}

export async function fetchTickets() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/tickets`, new URLSearchParams({ organizationId }));
}

export async function fetchAssets() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(`/assets`, new URLSearchParams({ organizationId }));
}

export async function fetchAssetOrgReport(
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
    condition?: string;
    storeId?: string;
    userId?: string;
    search?: string;
    dateFilter?: DateFilter;
    includeDeleted?: boolean;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  const range = options.dateFilter ? getDateRange(options.dateFilter) : {};
  const startDate = options.startDate || range.startDate;
  const endDate = options.endDate || range.endDate;
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.condition && options.condition !== 'all') params.set('condition', options.condition);
  if (options.storeId && options.storeId !== 'all') params.set('storeId', options.storeId);
  if (options.userId && options.userId !== 'all') params.set('userId', options.userId);
  if (options.search) params.set('search', options.search);
  if (options.includeDeleted) params.set('includeDeleted', 'true');
  return orgGet<any>(`/assets/reports/org-report`, params);
}

export async function fetchAssessments() {
  return orgGet<any[]>(`/assessments`, new URLSearchParams({ organizationId: getReportContext().organizationId }));
}

export async function fetchLearningOrgReport(
  dateFilter: DateFilter = 'all',
  tab = 'courses',
  options: {
    status?: string;
    userId?: string;
    categoryId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId, tab }), dateFilter);
  const range = getDateRange(dateFilter);
  const startDate = options.startDate || range.startDate;
  const endDate = options.endDate || range.endDate;
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.userId && options.userId !== 'all') params.set('userId', options.userId);
  if (options.categoryId && options.categoryId !== 'all') params.set('categoryId', options.categoryId);
  if (options.search) params.set('search', options.search);
  return orgGet<any>(`/courses/reports/org-report`, params);
}

export async function fetchLearningMyReport(options: { startDate?: string; endDate?: string } = {}) {
  const { organizationId, userId } = getReportContext();
  const params = new URLSearchParams({ organizationId, userId });
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  return orgGet<any>(`/courses/reports/my-report`, params);
}

export async function fetchLearningTeamReport(options: { startDate?: string; endDate?: string } = {}) {
  const { organizationId, userId } = getReportContext();
  const params = new URLSearchParams({ organizationId, supervisorId: userId });
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  return orgGet<any>(`/courses/reports/team-report`, params);
}

export async function fetchLearningStoreReport(
  storeId: string,
  options: { startDate?: string; endDate?: string } = {},
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId, storeId });
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  return orgGet<any>(`/courses/reports/store-report`, params);
}

export async function fetchExpiredSubmissionsReport() {
  const { organizationId } = getReportContext();
  return orgGet<any[]>(
    `/submissions/reports/expired-submissions`,
    new URLSearchParams({ organizationId }),
  );
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

export async function fetchAssessmentReport(
  assessmentId: string,
  dateFilter: DateFilter = 'all',
) {
  const { organizationId } = getReportContext();
  const params = withDateParams(
    new URLSearchParams({ organizationId, assessmentId }),
    dateFilter,
  );
  return orgGet<any[]>(`/assessments/reports/assessment-report`, params);
}

export async function fetchAssessmentAnalytics(
  dateFilter: DateFilter = 'all',
  assessmentId?: string,
) {
  const { organizationId } = getReportContext();
  const params = withDateParams(new URLSearchParams({ organizationId }), dateFilter);
  if (assessmentId) params.set('assessmentId', assessmentId);
  return orgGet<any>(`/assessments/reports/analytics`, params);
}

export async function fetchAssessmentComparison(
  assessmentId: string,
  mode: 'latest' | 'best' = 'best',
) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({
    organizationId,
    assessmentId,
    mode,
  });
  return orgGet<any>(`/assessments/reports/comparison`, params);
}

export async function fetchAssessmentSubmissionList(assessmentId: string) {
  const { organizationId } = getReportContext();
  const params = new URLSearchParams({ organizationId });
  return orgGet<any[]>(
    `/assessments/reports/submission-list/${assessmentId}`,
    params,
  );
}

export async function fetchAssessmentSubmissionDetail(submissionId: string) {
  return orgGet<any>(`/assessments/reports/submission/${submissionId}`);
}

export async function deleteAssessmentSubmission(submissionId: string) {
  const response = await fetch(
    `${ORG_API}/assessments/reports/submission/${submissionId}`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    throw new Error(`Failed to delete submission (${response.status})`);
  }
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
