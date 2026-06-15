import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BIDashboard, BIChart } from './bi-dashboard.entity';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { ActionPoint } from '../action-points/action-point.entity';
import { Ticket } from '../tickets/ticket.entity';

@Injectable()
export class BIDashboardService {
  constructor(
    @InjectRepository(BIDashboard)
    private biDashboardRepository: Repository<BIDashboard>,
    @InjectRepository(BIChart)
    private biChartRepository: Repository<BIChart>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
    @InjectRepository(ActionPoint)
    private actionPointRepository: Repository<ActionPoint>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async createDashboard(data: {
    title: string;
    type: 'process-workflow' | 'ticket' | 'action-point';
    organizationId: string;
    createdBy: string;
    includeActionPoints?: boolean;
    ticketType?: 'normal' | 'asset';
    processIds?: string[];
    ownerIds: string[];
    assigneeIds: string[];
    readOnlyAssigneeIds: string[];
  }) {
    const dashboard = this.biDashboardRepository.create({
      ...data,
      chartsCount: 0,
    });
    return this.biDashboardRepository.save(dashboard);
  }

  async updateDashboard(id: string, data: Partial<BIDashboard>) {
    await this.biDashboardRepository.update(id, data);
    return this.biDashboardRepository.findOne({ where: { id } });
  }

  async deleteDashboard(id: string) {
    return this.biDashboardRepository.delete(id);
  }

  async getDashboards(organizationId: string, type?: string) {
    const query = this.biDashboardRepository.createQueryBuilder('dashboard')
      .where('dashboard.organizationId = :organizationId', { organizationId });

    if (type) {
      query.andWhere('dashboard.type = :type', { type });
    }

    return query.getMany();
  }

  async getDashboard(id: string) {
    return this.biDashboardRepository.findOne({
      where: { id },
      relations: ['charts'],
    });
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
  }) {
    const chart = this.biChartRepository.create(data);
    const savedChart = await this.biChartRepository.save(chart);

    // Update dashboard charts count
    await this.biDashboardRepository.increment(
      { id: data.dashboardId },
      'chartsCount',
      1,
    );

    return savedChart;
  }

  async updateChart(id: string, data: Partial<BIChart>) {
    await this.biChartRepository.update(id, data);
    return this.biChartRepository.findOne({ where: { id } });
  }

  async deleteChart(id: string) {
    const chart = await this.biChartRepository.findOne({ where: { id } });
    if (chart) {
      await this.biDashboardRepository.decrement(
        { id: chart.dashboardId },
        'chartsCount',
        1,
      );
    }
    return this.biChartRepository.delete(id);
  }

  async getDashboardData(dashboardId: string, startDate?: Date, endDate?: Date) {
    const dashboard = await this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    let data: any = {};

    if (dashboard.type === 'process-workflow') {
      data = await this.getProcessWorkflowData(dashboard, startDate, endDate);
    } else if (dashboard.type === 'ticket') {
      data = await this.getTicketData(dashboard, startDate, endDate);
    } else if (dashboard.type === 'action-point') {
      data = await this.getActionPointData(dashboard, startDate, endDate);
    }

    return data;
  }

  private async getProcessWorkflowData(dashboard: BIDashboard, startDate?: Date, endDate?: Date) {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.submittedAt <= :endDate', { endDate });
    }

    if (dashboard.processIds && dashboard.processIds.length > 0) {
      query.andWhere('submission.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
    }

    const submissions = await query.getMany();

    // Calculate KPIs
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'new' || s.status === 'correction').length;
    const completionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

    // Get process-wise data
    const processWiseData: Record<string, any> = {};
    submissions.forEach(submission => {
      const processName = submission.process?.title || submission.audit?.title || 'Unknown';
      if (!processWiseData[processName]) {
        processWiseData[processName] = {
          processName,
          total: 0,
          completed: 0,
          pending: 0,
        };
      }
      processWiseData[processName].total++;
      if (submission.status === 'completed') {
        processWiseData[processName].completed++;
      } else {
        processWiseData[processName].pending++;
      }
    });

    // Get action points if included
    let actionPointsData: any = null;
    if (dashboard.includeActionPoints) {
      const actionPointQuery = this.actionPointRepository.createQueryBuilder('actionPoint')
        .where('actionPoint.organizationId = :organizationId', { organizationId: dashboard.organizationId });

      if (startDate) {
        actionPointQuery.andWhere('actionPoint.createdAt >= :startDate', { startDate });
      }
      if (endDate) {
        actionPointQuery.andWhere('actionPoint.createdAt <= :endDate', { endDate });
      }

      if (dashboard.processIds && dashboard.processIds.length > 0) {
        actionPointQuery.andWhere('actionPoint.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
      }

      const actionPoints = await actionPointQuery.getMany();
      actionPointsData = {
        total: actionPoints.length,
        open: actionPoints.filter(ap => ap.status === 'open').length,
        inProgress: actionPoints.filter(ap => ap.status === 'in-progress').length,
        completed: actionPoints.filter(ap => ap.status === 'completed').length,
        closed: actionPoints.filter(ap => ap.status === 'closed').length,
      };
    }

    return {
      kpis: {
        totalSubmissions,
        completedSubmissions,
        pendingSubmissions,
        completionRate,
      },
      processWiseData: Object.values(processWiseData),
      actionPointsData,
    };
  }

  private async getTicketData(dashboard: BIDashboard, startDate?: Date, endDate?: Date) {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('ticket.createdAt <= :endDate', { endDate });
    }

    if (dashboard.ticketType === 'asset') {
      query.andWhere('ticket.assetId IS NOT NULL');
    } else if (dashboard.ticketType === 'normal') {
      query.andWhere('ticket.assetId IS NULL');
    }

    const tickets = await query.getMany();

    // Calculate KPIs
    const open = tickets.filter(t => t.status === 'open').length;
    const onHold = tickets.filter(t => t.status === 'on-hold').length;
    const completed = tickets.filter(t => t.status === 'completed').length;
    const closed = tickets.filter(t => t.status === 'closed').length;

    // Calculate average completion and closure times
    const completedTickets = tickets.filter(t => t.status === 'completed' || t.status === 'closed');
    const avgCompletionTime = completedTickets.length > 0 
      ? completedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const completed = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
          return sum + (completed - created);
        }, 0) / completedTickets.length / (1000 * 60 * 60) // in hours
      : 0;

    const avgClosureTime = completedTickets.length > 0
      ? completedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const closed = t.closedAt ? new Date(t.closedAt).getTime() : Date.now();
          return sum + (closed - created);
        }, 0) / completedTickets.length / (1000 * 60 * 60) // in hours
      : 0;

    // Time series data for line chart
    const timeSeriesData: Record<string, any> = {};
    tickets.forEach(ticket => {
      const date = new Date(ticket.createdAt).toISOString().split('T')[0];
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = {
          date,
          created: 0,
          completed: 0,
          closed: 0,
        };
      }
      timeSeriesData[date].created++;
      if (ticket.status === 'completed') {
        timeSeriesData[date].completed++;
      }
      if (ticket.status === 'closed') {
        timeSeriesData[date].closed++;
      }
    });

    return {
      kpis: {
        open,
        onHold,
        completed,
        closed,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        avgClosureTime: Math.round(avgClosureTime * 10) / 10,
      },
      timeSeriesData: Object.values(timeSeriesData).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  private async getActionPointData(dashboard: BIDashboard, startDate?: Date, endDate?: Date) {
    const query = this.actionPointRepository.createQueryBuilder('actionPoint')
      .where('actionPoint.organizationId = :organizationId', { organizationId: dashboard.organizationId });

    if (startDate) {
      query.andWhere('actionPoint.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('actionPoint.createdAt <= :endDate', { endDate });
    }

    if (dashboard.processIds && dashboard.processIds.length > 0) {
      query.andWhere('actionPoint.workflowId IN (:...processIds)', { processIds: dashboard.processIds });
    }

    const actionPoints = await query.getMany();

    // Calculate KPIs
    const open = actionPoints.filter(ap => ap.status === 'open').length;
    const inProgress = actionPoints.filter(ap => ap.status === 'in-progress').length;
    const completed = actionPoints.filter(ap => ap.status === 'completed').length;
    const closed = actionPoints.filter(ap => ap.status === 'closed').length;

    // Calculate average completion and closure times
    const completedActionPoints = actionPoints.filter(ap => ap.status === 'completed' || ap.status === 'closed');
    const avgCompletionTime = completedActionPoints.length > 0
      ? completedActionPoints.reduce((sum, ap) => {
          const created = new Date(ap.createdAt).getTime();
          const completed = ap.completedAt ? new Date(ap.completedAt).getTime() : Date.now();
          return sum + (completed - created);
        }, 0) / completedActionPoints.length / (1000 * 60 * 60) // in hours
      : 0;

    const avgClosureTime = completedActionPoints.length > 0
      ? completedActionPoints.reduce((sum, ap) => {
          const created = new Date(ap.createdAt).getTime();
          const closed = ap.closedAt ? new Date(ap.closedAt).getTime() : Date.now();
          return sum + (closed - created);
        }, 0) / completedActionPoints.length / (1000 * 60 * 60) // in hours
      : 0;

    // Priority-wise data
    const priorityWiseData: Record<string, any> = {};
    actionPoints.forEach(ap => {
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
    });

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
    };
  }
}
