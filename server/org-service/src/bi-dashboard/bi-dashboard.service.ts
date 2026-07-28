import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BIDashboard, BIChart } from './bi-dashboard.entity';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { ActionPoint } from '../action-points/action-point.entity';
import { Ticket } from '../tickets/ticket.entity';

type DashboardFilters = {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  priority?: string;
  search?: string;
};

@Injectable()
export class BIDashboardService {
  constructor(
    @InjectRepository(BIDashboard, 'org')
    private biDashboardRepository: Repository<BIDashboard>,
    @InjectRepository(BIChart, 'org')
    private biChartRepository: Repository<BIChart>,
    @InjectRepository(Submission, 'org')
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Process, 'org')
    private processRepository: Repository<Process>,
    @InjectRepository(Audit, 'org')
    private auditRepository: Repository<Audit>,
    @InjectRepository(ActionPoint, 'org')
    private actionPointRepository: Repository<ActionPoint>,
    @InjectRepository(Ticket, 'org')
    private ticketRepository: Repository<Ticket>,
  ) {}

  private normalizeIds(ids?: string[] | null): string[] {
    return (ids ?? []).map((id) => String(id).trim()).filter(Boolean);
  }

  private hasShareRestrictions(dashboard: BIDashboard): boolean {
    // Owner-only (creator) metadata is not an ACL lock. Restrictions apply once
    // editors or viewers are explicitly shared.
    return (
      this.normalizeIds(dashboard.assigneeIds).length > 0 ||
      this.normalizeIds(dashboard.readOnlyAssigneeIds).length > 0
    );
  }

  private canAccessDashboard(dashboard: BIDashboard, userId?: string): boolean {
    if (!userId) return true;
    if (!this.hasShareRestrictions(dashboard)) return true;
    const allowed = new Set([
      dashboard.createdBy,
      ...this.normalizeIds(dashboard.ownerIds),
      ...this.normalizeIds(dashboard.assigneeIds),
      ...this.normalizeIds(dashboard.readOnlyAssigneeIds),
    ]);
    return allowed.has(userId);
  }

  private canEditDashboard(dashboard: BIDashboard, userId?: string): boolean {
    if (!userId) return true;
    if (!this.hasShareRestrictions(dashboard)) return true;
    const editors = new Set([
      dashboard.createdBy,
      ...this.normalizeIds(dashboard.ownerIds),
      ...this.normalizeIds(dashboard.assigneeIds),
    ]);
    return editors.has(userId);
  }

  private assertAccess(dashboard: BIDashboard | null, userId?: string, requireEdit = false) {
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    if (requireEdit ? !this.canEditDashboard(dashboard, userId) : !this.canAccessDashboard(dashboard, userId)) {
      throw new ForbiddenException('You do not have permission to access this dashboard');
    }
  }

  async createDashboard(data: {
    title: string;
    type: 'process-workflow' | 'ticket' | 'action-point';
    organizationId: string;
    createdBy: string;
    includeActionPoints?: boolean;
    ticketType?: 'normal' | 'asset' | null;
    processIds?: string[];
    ownerIds?: string[];
    assigneeIds?: string[];
    readOnlyAssigneeIds?: string[];
    templateId?: string;
    config?: any;
  }) {
    const ownerIds = this.normalizeIds(data.ownerIds?.length ? data.ownerIds : [data.createdBy]);
    const dashboard = this.biDashboardRepository.create({
      ...data,
      ownerIds,
      assigneeIds: this.normalizeIds(data.assigneeIds),
      readOnlyAssigneeIds: this.normalizeIds(data.readOnlyAssigneeIds),
      processIds: this.normalizeIds(data.processIds),
      config: {
        ...(data.config ?? {}),
        ...(data.templateId ? { templateId: data.templateId } : {}),
      },
      chartsCount: 0,
    });
    return this.biDashboardRepository.save(dashboard);
  }

  async updateDashboard(id: string, data: Partial<BIDashboard> & { lastModifiedBy?: string }, userId?: string) {
    const existing = await this.biDashboardRepository.findOne({ where: { id } });
    this.assertAccess(existing, userId, true);

    const { lastModifiedBy, ...rest } = data as Partial<BIDashboard> & { lastModifiedBy?: string };
    const patch: Partial<BIDashboard> = { ...rest };
    if (!patch.updatedBy && lastModifiedBy) patch.updatedBy = lastModifiedBy;
    if (userId && !patch.updatedBy) patch.updatedBy = userId;
    if (data.ownerIds) patch.ownerIds = this.normalizeIds(data.ownerIds as any);
    if (data.assigneeIds) patch.assigneeIds = this.normalizeIds(data.assigneeIds as any);
    if (data.readOnlyAssigneeIds) patch.readOnlyAssigneeIds = this.normalizeIds(data.readOnlyAssigneeIds as any);
    if (data.processIds) patch.processIds = this.normalizeIds(data.processIds as any);
    if (data.config && existing) {
      patch.config = { ...(existing.config ?? {}), ...data.config };
    }

    await this.biDashboardRepository.update(id, patch);
    return this.getDashboard(id, userId);
  }

  async shareDashboard(
    id: string,
    payload: {
      ownerIds?: string[];
      assigneeIds?: string[];
      readOnlyAssigneeIds?: string[];
      updatedBy?: string;
      lastModifiedBy?: string;
    },
    userId?: string,
  ) {
    return this.updateDashboard(
      id,
      {
        ownerIds: payload.ownerIds,
        assigneeIds: payload.assigneeIds,
        readOnlyAssigneeIds: payload.readOnlyAssigneeIds,
        updatedBy: payload.updatedBy || payload.lastModifiedBy,
      } as any,
      userId,
    );
  }

  async deleteDashboard(id: string, userId?: string) {
    const existing = await this.biDashboardRepository.findOne({ where: { id } });
    this.assertAccess(existing, userId, true);
    return this.biDashboardRepository.delete(id);
  }

  async getDashboards(organizationId: string, type?: string, userId?: string) {
    const query = this.biDashboardRepository
      .createQueryBuilder('dashboard')
      .leftJoinAndSelect('dashboard.charts', 'charts')
      .where('dashboard.organizationId = :organizationId', { organizationId });

    if (type) {
      query.andWhere('dashboard.type = :type', { type });
    }

    const dashboards = await query.orderBy('dashboard.updatedAt', 'DESC').getMany();
    return dashboards
      .filter((d) => this.canAccessDashboard(d, userId))
      .map((d) => ({
        ...d,
        permission: this.canEditDashboard(d, userId) ? 'edit' : 'view',
      }));
  }

  async createDashboardFromTemplate(
    templateId: string,
    payload: {
      title?: string;
      organizationId: string;
      createdBy: string;
      updatedBy?: string;
      lastModifiedBy?: string;
    },
  ) {
    const { DASHBOARD_TEMPLATE_LIBRARY } = await import('./dashboard-templates');
    const template = DASHBOARD_TEMPLATE_LIBRARY.find((item) => item.id === templateId);
    if (!template) {
      throw new Error('Dashboard template not found');
    }

    const dashboard = await this.createDashboard({
      title: payload.title?.trim() || template.name,
      type: template.category,
      organizationId: payload.organizationId,
      createdBy: payload.createdBy,
      includeActionPoints: template.includeActionPoints ?? false,
      ticketType: template.ticketType ?? null,
      templateId: template.id,
      ownerIds: [payload.createdBy],
      config: { templateId: template.id, tags: template.tags },
    });

    await this.createChart({
      dashboardId: dashboard.id,
      title: `${dashboard.title} — ${template.chartType}`,
      chartType: template.chartType as any,
      config: { templateId: template.id, tags: template.tags, metric: 'status' },
      positionX: 0,
      positionY: 0,
      width: 2,
      height: 1,
    });

    // Add a companion table chart for richer templates
    if (template.chartType !== 'table' && template.chartType !== 'kpi') {
      await this.createChart({
        dashboardId: dashboard.id,
        title: `${dashboard.title} — Details`,
        chartType: 'table',
        config: { templateId: template.id, companion: true },
        positionX: 0,
        positionY: 1,
        width: 2,
        height: 1,
      });
    }

    return this.getDashboard(dashboard.id, payload.createdBy);
  }

  async getDashboard(id: string, userId?: string) {
    const dashboard = await this.biDashboardRepository.findOne({
      where: { id },
      relations: ['charts'],
    });
    this.assertAccess(dashboard, userId);
    return {
      ...dashboard!,
      permission: this.canEditDashboard(dashboard!, userId) ? 'edit' : 'view',
    };
  }

  async createChart(data: {
    dashboardId: string;
    title: string;
    chartType: 'bar' | 'group' | 'stack' | 'line' | 'pie' | 'heatmap' | 'table' | 'advanced-table' | 'kpi' | 'label';
    config: any;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
  }, userId?: string) {
    const dashboard = await this.biDashboardRepository.findOne({ where: { id: data.dashboardId } });
    this.assertAccess(dashboard, userId, true);

    const chart = this.biChartRepository.create(data);
    const savedChart = await this.biChartRepository.save(chart);

    await this.biDashboardRepository.increment({ id: data.dashboardId }, 'chartsCount', 1);

    return savedChart;
  }

  async updateChart(id: string, data: Partial<BIChart>, userId?: string) {
    const chart = await this.biChartRepository.findOne({ where: { id } });
    if (!chart) throw new NotFoundException('Chart not found');
    const dashboard = await this.biDashboardRepository.findOne({ where: { id: chart.dashboardId } });
    this.assertAccess(dashboard, userId, true);

    const patch: Partial<BIChart> = { ...data };
    if (data.config) {
      patch.config = { ...(chart.config ?? {}), ...data.config };
    }
    await this.biChartRepository.update(id, patch);
    return this.biChartRepository.findOne({ where: { id } });
  }

  async deleteChart(id: string, userId?: string) {
    const chart = await this.biChartRepository.findOne({ where: { id } });
    if (!chart) throw new NotFoundException('Chart not found');
    const dashboard = await this.biDashboardRepository.findOne({ where: { id: chart.dashboardId } });
    this.assertAccess(dashboard, userId, true);

    await this.biDashboardRepository.decrement({ id: chart.dashboardId }, 'chartsCount', 1);
    return this.biChartRepository.delete(id);
  }

  async getDashboardData(dashboardId: string, filters: DashboardFilters = {}, userId?: string) {
    const dashboard = await this.biDashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['charts'],
    });
    this.assertAccess(dashboard, userId);

    const merged: DashboardFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status || dashboard!.config?.statusFilter || undefined,
      priority: filters.priority || dashboard!.config?.priorityFilter || undefined,
      search: filters.search || dashboard!.config?.search || undefined,
    };

    let data: any = {};
    if (dashboard!.type === 'process-workflow') {
      data = await this.getProcessWorkflowData(dashboard!, merged);
    } else if (dashboard!.type === 'ticket') {
      data = await this.getTicketData(dashboard!, merged);
    } else if (dashboard!.type === 'action-point') {
      data = await this.getActionPointData(dashboard!, merged);
    }

    return {
      ...data,
      filters: merged,
      dashboardId,
      type: dashboard!.type,
      permission: this.canEditDashboard(dashboard!, userId) ? 'edit' : 'view',
    };
  }

  private async getProcessWorkflowData(dashboard: BIDashboard, filters: DashboardFilters) {
    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (filters.startDate) query.andWhere('submission.submittedAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) query.andWhere('submission.submittedAt <= :endDate', { endDate: filters.endDate });
    if (dashboard.processIds?.length) {
      query.andWhere('submission.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
    }
    if (filters.status) {
      query.andWhere('submission.status = :status', { status: filters.status });
    }
    if (filters.search) {
      query.andWhere('(process.title ILIKE :search OR audit.title ILIKE :search OR submission.status ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const submissions = await query.getMany();

    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter((s) => s.status === 'completed').length;
    const pendingSubmissions = submissions.filter((s) => s.status === 'new' || s.status === 'correction').length;
    const completionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

    const processWiseData: Record<string, any> = {};
    const statusWiseData: Record<string, any> = {};
    const timeSeriesData: Record<string, any> = {};

    submissions.forEach((submission) => {
      const processName = submission.process?.title || submission.audit?.title || 'Unknown';
      if (!processWiseData[processName]) {
        processWiseData[processName] = { processName, total: 0, completed: 0, pending: 0 };
      }
      processWiseData[processName].total++;
      if (submission.status === 'completed') processWiseData[processName].completed++;
      else processWiseData[processName].pending++;

      const status = submission.status || 'unknown';
      if (!statusWiseData[status]) statusWiseData[status] = { name: status, value: 0 };
      statusWiseData[status].value++;

      const date = new Date(submission.submittedAt || submission.createdAt).toISOString().split('T')[0];
      if (!timeSeriesData[date]) timeSeriesData[date] = { date, created: 0, completed: 0, pending: 0 };
      timeSeriesData[date].created++;
      if (submission.status === 'completed') timeSeriesData[date].completed++;
      else timeSeriesData[date].pending++;
    });

    let actionPointsData: any = null;
    if (dashboard.includeActionPoints) {
      const actionPointQuery = this.actionPointRepository
        .createQueryBuilder('actionPoint')
        .where('actionPoint.organizationId = :organizationId', { organizationId: dashboard.organizationId });

      if (filters.startDate) actionPointQuery.andWhere('actionPoint.createdAt >= :startDate', { startDate: filters.startDate });
      if (filters.endDate) actionPointQuery.andWhere('actionPoint.createdAt <= :endDate', { endDate: filters.endDate });
      if (dashboard.processIds?.length) {
        actionPointQuery.andWhere('actionPoint.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
      }

      const actionPoints = await actionPointQuery.getMany();
      actionPointsData = {
        total: actionPoints.length,
        open: actionPoints.filter((ap) => ap.status === 'open').length,
        inProgress: actionPoints.filter((ap) => ap.status === 'in-progress').length,
        completed: actionPoints.filter((ap) => ap.status === 'completed').length,
        closed: actionPoints.filter((ap) => ap.status === 'closed').length,
      };
    }

    const tableRows = Object.values(processWiseData).map((row: any) => ({
      name: row.processName,
      total: row.total,
      completed: row.completed,
      pending: row.pending,
      completionRate: row.total ? Math.round((row.completed / row.total) * 100) : 0,
    }));

    return {
      kpis: { totalSubmissions, completedSubmissions, pendingSubmissions, completionRate },
      processWiseData: Object.values(processWiseData),
      statusWiseData: Object.values(statusWiseData),
      timeSeriesData: Object.values(timeSeriesData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      tableRows,
      actionPointsData,
    };
  }

  private async getTicketData(dashboard: BIDashboard, filters: DashboardFilters) {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (filters.startDate) query.andWhere('ticket.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) query.andWhere('ticket.createdAt <= :endDate', { endDate: filters.endDate });
    // Ticket entity has no assetId column — detect asset-linked tickets via tags/title/costs JSON.
    if (dashboard.ticketType === 'asset') {
      query.andWhere(`(
        COALESCE(ticket.tags::text, '') ILIKE '%asset%'
        OR ticket.title ILIKE '%asset%'
        OR COALESCE(ticket.description, '') ILIKE '%asset%'
        OR COALESCE(ticket.costs::text, '') ILIKE '%assetId%'
      )`);
    } else if (dashboard.ticketType === 'normal') {
      query.andWhere(`(
        COALESCE(ticket.tags::text, '') NOT ILIKE '%asset%'
        AND ticket.title NOT ILIKE '%asset%'
        AND COALESCE(ticket.description, '') NOT ILIKE '%asset%'
        AND COALESCE(ticket.costs::text, '') NOT ILIKE '%assetId%'
      )`);
    }
    if (filters.status) query.andWhere('ticket.status = :status', { status: filters.status });
    if (filters.priority) query.andWhere('ticket.priority = :priority', { priority: filters.priority });
    if (filters.search) {
      query.andWhere('(ticket.title ILIKE :search OR ticket.status ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const tickets = await query.getMany();

    const isOnHold = (s: string) => s === 'on-hold' || s === 'on_hold';
    const isCompleted = (s: string) => s === 'completed' || s === 'complete';
    const open = tickets.filter((t) => t.status === 'open').length;
    const onHold = tickets.filter((t) => isOnHold(t.status)).length;
    const completed = tickets.filter((t) => isCompleted(t.status)).length;
    const closed = tickets.filter((t) => t.status === 'closed').length;

    const completedTickets = tickets.filter((t) => isCompleted(t.status) || t.status === 'closed');
    const avgCompletionTime =
      completedTickets.length > 0
        ? completedTickets.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime();
            const done = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
            return sum + (done - created);
          }, 0) /
          completedTickets.length /
          (1000 * 60 * 60)
        : 0;

    const avgClosureTime =
      completedTickets.length > 0
        ? completedTickets.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime();
            const closedAt = t.closedAt ? new Date(t.closedAt).getTime() : Date.now();
            return sum + (closedAt - created);
          }, 0) /
          completedTickets.length /
          (1000 * 60 * 60)
        : 0;

    const timeSeriesData: Record<string, any> = {};
    const statusWiseData = [
      { name: 'Open', value: open },
      { name: 'On Hold', value: onHold },
      { name: 'Completed', value: completed },
      { name: 'Closed', value: closed },
    ];
    const priorityWiseData: Record<string, any> = {};

    tickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt).toISOString().split('T')[0];
      if (!timeSeriesData[date]) timeSeriesData[date] = { date, created: 0, completed: 0, closed: 0 };
      timeSeriesData[date].created++;
      if (isCompleted(ticket.status)) timeSeriesData[date].completed++;
      if (ticket.status === 'closed') timeSeriesData[date].closed++;

      const priority = ticket.priority || 'medium';
      if (!priorityWiseData[priority]) {
        priorityWiseData[priority] = { priority, total: 0, open: 0, completed: 0, closed: 0 };
      }
      priorityWiseData[priority].total++;
      if (ticket.status === 'open') priorityWiseData[priority].open++;
      if (isCompleted(ticket.status)) priorityWiseData[priority].completed++;
      if (ticket.status === 'closed') priorityWiseData[priority].closed++;
    });

    const tableRows = tickets.slice(0, 200).map((t) => ({
      id: t.id,
      title: t.title || t.id,
      status: t.status,
      priority: t.priority || 'medium',
      assignedTo: t.assignedTo || '—',
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : '—',
    }));

    return {
      kpis: {
        open,
        onHold,
        completed,
        closed,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        avgClosureTime: Math.round(avgClosureTime * 10) / 10,
      },
      timeSeriesData: Object.values(timeSeriesData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      statusWiseData,
      priorityWiseData: Object.values(priorityWiseData),
      tableRows,
    };
  }

  private async getActionPointData(dashboard: BIDashboard, filters: DashboardFilters) {
    const query = this.actionPointRepository
      .createQueryBuilder('actionPoint')
      .where('actionPoint.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (filters.startDate) query.andWhere('actionPoint.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) query.andWhere('actionPoint.createdAt <= :endDate', { endDate: filters.endDate });
    if (dashboard.processIds?.length) {
      query.andWhere('actionPoint.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
    }
    if (filters.status) query.andWhere('actionPoint.status = :status', { status: filters.status });
    if (filters.priority) query.andWhere('actionPoint.priority = :priority', { priority: filters.priority });
    if (filters.search) {
      query.andWhere('(actionPoint.title ILIKE :search OR actionPoint.status ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const actionPoints = await query.getMany();

    const open = actionPoints.filter((ap) => ap.status === 'open').length;
    const inProgress = actionPoints.filter((ap) => ap.status === 'in-progress').length;
    const completed = actionPoints.filter((ap) => ap.status === 'completed').length;
    const closed = actionPoints.filter((ap) => ap.status === 'closed').length;

    const completedActionPoints = actionPoints.filter((ap) => ap.status === 'completed' || ap.status === 'closed');
    const avgCompletionTime =
      completedActionPoints.length > 0
        ? completedActionPoints.reduce((sum, ap) => {
            const created = new Date(ap.createdAt).getTime();
            const done = ap.completedAt ? new Date(ap.completedAt).getTime() : Date.now();
            return sum + (done - created);
          }, 0) /
          completedActionPoints.length /
          (1000 * 60 * 60)
        : 0;

    const avgClosureTime =
      completedActionPoints.length > 0
        ? completedActionPoints.reduce((sum, ap) => {
            const created = new Date(ap.createdAt).getTime();
            const closedAt = ap.closedAt ? new Date(ap.closedAt).getTime() : Date.now();
            return sum + (closedAt - created);
          }, 0) /
          completedActionPoints.length /
          (1000 * 60 * 60)
        : 0;

    const priorityWiseData: Record<string, any> = {};
    const statusWiseData = [
      { name: 'Open', value: open },
      { name: 'In Progress', value: inProgress },
      { name: 'Completed', value: completed },
      { name: 'Closed', value: closed },
    ];
    const timeSeriesData: Record<string, any> = {};

    actionPoints.forEach((ap) => {
      const priority = ap.priority || 'medium';
      if (!priorityWiseData[priority]) {
        priorityWiseData[priority] = {
          priority,
          total: 0,
          open: 0,
          inProgress: 0,
          completed: 0,
          closed: 0,
        };
      }
      priorityWiseData[priority].total++;
      if (ap.status === 'open') priorityWiseData[priority].open++;
      else if (ap.status === 'in-progress') priorityWiseData[priority].inProgress++;
      else if (ap.status === 'completed') priorityWiseData[priority].completed++;
      else if (ap.status === 'closed') priorityWiseData[priority].closed++;

      const date = new Date(ap.createdAt).toISOString().split('T')[0];
      if (!timeSeriesData[date]) timeSeriesData[date] = { date, created: 0, completed: 0, closed: 0 };
      timeSeriesData[date].created++;
      if (ap.status === 'completed') timeSeriesData[date].completed++;
      if (ap.status === 'closed') timeSeriesData[date].closed++;
    });

    const tableRows = actionPoints.slice(0, 200).map((ap) => ({
      id: ap.id,
      title: ap.title || ap.id,
      status: ap.status,
      priority: ap.priority || 'medium',
      assignedTo: ap.assignedTo || '—',
      dueDate: ap.dueDate ? new Date(ap.dueDate).toISOString().slice(0, 10) : '—',
      createdAt: ap.createdAt ? new Date(ap.createdAt).toISOString().slice(0, 10) : '—',
    }));

    return {
      kpis: {
        open,
        inProgress,
        completed,
        closed,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        avgClosureTime: Math.round(avgClosureTime * 10) / 10,
      },
      priorityWiseData: Object.values(priorityWiseData),
      statusWiseData,
      timeSeriesData: Object.values(timeSeriesData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      tableRows,
    };
  }
}
