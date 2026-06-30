import { getReportContext } from './reportApi';

const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';

function ctx() {
  const { organizationId, userId } = getReportContext();
  return { organizationId, userId };
}

async function orgRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ORG_API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type DashboardType = 'process-workflow' | 'ticket' | 'action-point';

export async function fetchDashboards(type?: DashboardType) {
  const { organizationId } = ctx();
  const params = new URLSearchParams({ organizationId });
  if (type) params.set('type', type);
  return orgRequest<any[]>(`/bi-dashboard?${params}`);
}

export async function fetchDashboard(id: string) {
  return orgRequest<any>(`/bi-dashboard/${id}`);
}

export async function fetchDashboardData(id: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const query = params.toString();
  return orgRequest<any>(`/bi-dashboard/${id}/data${query ? `?${query}` : ''}`);
}

export async function createDashboard(payload: {
  title: string;
  type: DashboardType;
  includeActionPoints?: boolean;
  ticketType?: 'normal' | 'asset';
  processIds?: string[];
  chartType?: string;
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
      organizationId,
      createdBy: userId,
      lastModifiedBy: userId,
    }),
  });

  if (payload.chartType && dashboard?.id) {
    await orgRequest(`/bi-dashboard/${dashboard.id}/charts`, {
      method: 'POST',
      body: JSON.stringify({
        title: `${payload.title} Chart`,
        chartType: payload.chartType,
        config: {},
        positionX: 0,
        positionY: 0,
        width: 2,
        height: 1,
      }),
    });
  }

  return dashboard;
}

export async function updateDashboard(id: string, payload: Partial<{ title: string; includeActionPoints: boolean }>) {
  const { userId } = ctx();
  return orgRequest<any>(`/bi-dashboard/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, lastModifiedBy: userId }),
  });
}

export async function deleteDashboard(id: string) {
  return orgRequest<void>(`/bi-dashboard/${id}`, { method: 'DELETE' });
}

export function tabToDashboardType(tab: string): DashboardType {
  if (tab === 'Ticket & Action Point') return 'action-point';
  return 'process-workflow';
}
