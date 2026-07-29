import { getReportContext } from './reportApi';

const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

function ctx() {
  const { organizationId, userId } = getReportContext();
  return { organizationId, userId: userId || 'admin' };
}

async function orgRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ORG_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Dashboard request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type DashboardType = 'process-workflow' | 'ticket' | 'action-point';
export type ChartType = 'bar' | 'line' | 'pie' | 'kpi' | 'table';

export type DashboardTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  category: DashboardType;
  chartType: string;
  includeActionPoints?: boolean;
  ticketType?: 'normal' | 'asset' | null;
  tags: string[];
};

export type DashboardDataFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  search?: string;
};

export async function fetchDashboardTemplates() {
  try {
    return await orgRequest<DashboardTemplateDefinition[]>('/bi-dashboard/templates/list');
  } catch {
    const { DASHBOARD_TEMPLATE_LIBRARY } = await import('./dashboardTemplates');
    return DASHBOARD_TEMPLATE_LIBRARY;
  }
}

export async function createDashboardFromTemplate(templateId: string, title?: string) {
  const { organizationId, userId } = ctx();
  return orgRequest<any>('/bi-dashboard/from-template', {
    method: 'POST',
    body: JSON.stringify({
      templateId,
      title,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
    }),
  });
}

export async function fetchDashboards(type?: DashboardType) {
  const { organizationId, userId } = ctx();
  const params = new URLSearchParams({ organizationId, userId });
  if (type) params.set('type', type);
  return orgRequest<any[]>(`/bi-dashboard?${params}`);
}

export async function fetchDashboard(id: string) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/${id}?userId=${encodeURIComponent(userId)}`);
}

export async function fetchDashboardData(id: string, filters: DashboardDataFilters = {}) {
  const { userId } = ctx();
  const params = new URLSearchParams({ userId });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.search) params.set('search', filters.search);
  return orgRequest<any>(`/bi-dashboard/${id}/data?${params}`);
}

export async function createDashboard(payload: {
  title: string;
  type: DashboardType;
  includeActionPoints?: boolean;
  ticketType?: 'normal' | 'asset' | null;
  processIds?: string[];
  chartType?: ChartType | string;
  chartTitle?: string;
  ownerIds?: string[];
  assigneeIds?: string[];
  readOnlyAssigneeIds?: string[];
  config?: Record<string, unknown>;
}) {
  const { organizationId, userId } = ctx();
  const dashboard = await orgRequest<any>('/bi-dashboard', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      type: payload.type,
      includeActionPoints: payload.includeActionPoints ?? false,
      ticketType: payload.ticketType ?? null,
      processIds: payload.processIds ?? [],
      ownerIds: payload.ownerIds ?? [userId],
      assigneeIds: payload.assigneeIds ?? [],
      readOnlyAssigneeIds: payload.readOnlyAssigneeIds ?? [],
      config: payload.config ?? {},
      organizationId,
      createdBy: userId,
      updatedBy: userId,
    }),
  });

  if (payload.chartType && dashboard?.id) {
    await createChart(dashboard.id, {
      title: payload.chartTitle || `${payload.title} Chart`,
      chartType: payload.chartType,
      config: { metric: 'status' },
      positionX: 0,
      positionY: 0,
      width: 2,
      height: 1,
    });
  }

  return fetchDashboard(dashboard.id);
}

export async function updateDashboard(
  id: string,
  payload: Partial<{
    title: string;
    includeActionPoints: boolean;
    ticketType: 'normal' | 'asset' | null;
    processIds: string[];
    config: Record<string, unknown>;
    ownerIds: string[];
    assigneeIds: string[];
    readOnlyAssigneeIds: string[];
  }>,
) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, updatedBy: userId }),
  });
}

export async function shareDashboard(
  id: string,
  payload: {
    ownerIds?: string[];
    assigneeIds?: string[];
    readOnlyAssigneeIds?: string[];
  },
) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/${id}/share?userId=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, updatedBy: userId }),
  });
}

export async function createChart(
  dashboardId: string,
  payload: {
    title: string;
    chartType: string;
    config?: Record<string, unknown>;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
  },
) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/${dashboardId}/charts?userId=${encodeURIComponent(userId)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateChart(
  chartId: string,
  payload: Partial<{ title: string; chartType: string; config: Record<string, unknown> }>,
) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/charts/${chartId}?userId=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteChart(chartId: string) {
  const { userId } = ctx();
  return orgRequest<void>(`/bi-dashboard/charts/${chartId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export async function deleteDashboard(id: string) {
  const { userId } = ctx();
  return orgRequest<void>(`/bi-dashboard/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export function tabToDashboardType(tab: string): DashboardType | undefined {
  if (tab === 'Ticket & Action Point') return undefined;
  return 'process-workflow';
}

export function dashboardMatchesTab(dashboard: { type: string }, tab: string): boolean {
  if (tab === 'Ticket & Action Point') {
    return dashboard.type === 'ticket' || dashboard.type === 'action-point';
  }
  return dashboard.type === 'process-workflow';
}

export const GLOBAL_FILTER_KEY = 'customDashboardGlobalFilters';

export function loadGlobalFilters(): DashboardDataFilters {
  try {
    const raw = localStorage.getItem(GLOBAL_FILTER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveGlobalFilters(filters: DashboardDataFilters) {
  localStorage.setItem(GLOBAL_FILTER_KEY, JSON.stringify(filters));
}
