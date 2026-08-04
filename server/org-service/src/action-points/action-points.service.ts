import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActionPoint } from './action-point.entity';
import { Submission } from '../submissions/submission.entity';
import { notifyActionPointAssigned } from '../shared/notification-client';

@Injectable()
export class ActionPointsService {
  constructor(
    @InjectRepository(ActionPoint, 'org')
    private actionPointsRepository: Repository<ActionPoint>,
    @InjectRepository(Submission, 'org')
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async create(actionPointData: Partial<ActionPoint>): Promise<ActionPoint> {
    const actionPoint = this.actionPointsRepository.create(actionPointData);
    const saved = await this.actionPointsRepository.save(actionPoint);
    if (saved.assignedTo) {
      notifyActionPointAssigned({
        userId: saved.assignedTo,
        actionPointId: saved.id,
        actionPointTitle: saved.title,
        assignedBy: saved.createdBy,
      });
    }
    return saved;
  }

  async findAll(organizationId: string): Promise<ActionPoint[]> {
    return await this.actionPointsRepository.find({
      where: { organizationId },
      relations: ['submission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAssignedToMe(userId: string, organizationId: string): Promise<ActionPoint[]> {
    return await this.actionPointsRepository.find({
      where: { organizationId, assignedTo: userId },
      relations: ['submission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCreatedByMe(userId: string, organizationId: string): Promise<ActionPoint[]> {
    return await this.actionPointsRepository.find({
      where: { organizationId, createdBy: userId },
      relations: ['submission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findClosureAssignedToMe(userId: string, organizationId: string): Promise<ActionPoint[]> {
    return await this.actionPointsRepository.find({
      where: { organizationId, closureAssignedTo: userId },
      relations: ['submission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ActionPoint> {
    return await this.actionPointsRepository.findOne({
      where: { id },
      relations: ['submission'],
    });
  }

  async update(id: string, actionPointData: Partial<ActionPoint>): Promise<ActionPoint> {
    const existing = await this.findOne(id);
    await this.actionPointsRepository.update(id, actionPointData);
    const updated = await this.findOne(id);
    if (actionPointData.assignedTo && actionPointData.assignedTo !== existing?.assignedTo) {
      notifyActionPointAssigned({
        userId: actionPointData.assignedTo,
        actionPointId: id,
        actionPointTitle: updated.title,
        assignedBy: updated.updatedBy || updated.createdBy,
      });
    }
    return updated;
  }

  async updateStatus(id: string, status: string, userId: string): Promise<ActionPoint> {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'closed') {
      updateData.closedAt = new Date();
    }

    return await this.update(id, updateData);
  }

  async addComment(id: string, comment: any): Promise<ActionPoint> {
    const actionPoint = await this.findOne(id);
    if (!actionPoint) throw new Error('Action Point not found');

    const comments = actionPoint.comments || [];
    comments.push(comment);

    return await this.update(id, { comments });
  }

  async remove(id: string): Promise<void> {
    await this.actionPointsRepository.delete(id);
  }

  async createFromSubmission(payload: {
    submissionId: string;
    workflowType: 'process' | 'audit';
    workflowId: string;
    storeId: string;
    organizationId: string;
    createdBy: string;
    responses: Record<string, string>;
    questions: Array<{ id: string; questionText: string; options?: Record<string, unknown> }>;
  }): Promise<ActionPoint[]> {
    if (payload.workflowType === 'process' && payload.submissionId) {
      const submission = await this.submissionRepository.findOne({
        where: { id: payload.submissionId },
        relations: ['process'],
      });
      if (submission?.process?.properties?.createActionPointsFromReports !== true) {
        return [];
      }
    } else if (payload.workflowType === 'audit' && payload.submissionId) {
      const submission = await this.submissionRepository.findOne({
        where: { id: payload.submissionId },
        relations: ['audit'],
      });
      if (submission?.audit?.properties?.createActionPointsFromReports !== true) {
        return [];
      }
    }

    const created: ActionPoint[] = [];

    for (const question of payload.questions ?? []) {
      const opts = question.options ?? {};
      const mode = opts.actionPoint;
      if (mode !== 'auto') continue;

      const triggers = (opts.actionPointAutoTriggers as string[]) ?? [];
      const answer = payload.responses?.[question.id];
      if (!answer || !triggers.includes(answer)) continue;

      const existing = await this.actionPointsRepository.findOne({
        where: {
          submissionId: payload.submissionId,
          questionId: question.id,
        },
      });
      if (existing) continue;

      const autoConfig = (opts.actionPointAutoConfig as Record<string, unknown>) ?? {};
      const dueDays = Number(autoConfig.dueDays ?? 3);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      const ap = await this.create({
        title: String(autoConfig.title ?? `${question.questionText} — ${answer}`),
        description: String(autoConfig.description ?? `Auto action point for answer: ${answer}`),
        priority: String(autoConfig.priority ?? 'medium'),
        assignedTo: String(autoConfig.assignedTo ?? payload.createdBy),
        closureAssignedTo: String(autoConfig.closureAssignedTo ?? payload.createdBy),
        dueDate,
        triggerType: 'auto',
        submissionId: payload.submissionId,
        questionId: question.id,
        workflowType: payload.workflowType,
        workflowId: payload.workflowId,
        storeId: payload.storeId,
        organizationId: payload.organizationId,
        createdBy: payload.createdBy,
        autoTriggerConfig: { answer, triggers, ...autoConfig },
        status: 'open',
      });
      created.push(ap);
    }

    return created;
  }

  async carryForward(payload: {
    submissionId: string;
    workflowType: string;
    workflowId: string;
    storeId: string;
    organizationId: string;
    createdBy: string;
  }): Promise<ActionPoint[]> {
    const previous = await this.submissionRepository.findOne({
      where: {
        workflowType: payload.workflowType as any,
        workflowId: payload.workflowId,
        storeId: payload.storeId,
        organizationId: payload.organizationId,
        status: In(['completed', 'pending_review']) as any,
      },
      order: { createdAt: 'DESC' },
    });
    if (!previous || previous.id === payload.submissionId) return [];

    const openAps = await this.actionPointsRepository.find({
      where: {
        submissionId: previous.id,
        status: In(['open', 'in_progress', 'on_hold']),
      },
    });
    if (openAps.length === 0) return [];

    const created: ActionPoint[] = [];
    for (const ap of openAps) {
      const existing = await this.actionPointsRepository.findOne({
        where: {
          submissionId: payload.submissionId,
          title: ap.title,
          triggerType: 'carried',
        },
      });
      if (existing) continue;

      const clone = this.actionPointsRepository.create({
        title: ap.title,
        description: ap.description,
        priority: ap.priority,
        status: ap.status,
        assignedTo: ap.assignedTo,
        closureAssignedTo: ap.closureAssignedTo,
        dueDate: ap.dueDate,
        triggerType: 'carried',
        submissionId: payload.submissionId,
        questionId: ap.questionId,
        workflowType: ap.workflowType || payload.workflowType,
        workflowId: ap.workflowId || payload.workflowId,
        storeId: ap.storeId || payload.storeId,
        autoTriggerConfig: { carriedFromSubmissionId: previous.id },
        organizationId: payload.organizationId,
        createdBy: payload.createdBy,
      });
      const saved = await this.actionPointsRepository.save(clone);
      if (saved.assignedTo) {
        notifyActionPointAssigned({
          userId: saved.assignedTo,
          actionPointId: saved.id,
          actionPointTitle: saved.title,
          assignedBy: saved.createdBy,
        });
      }
      created.push(saved);
    }

    return created;
  }

  // Action Point Report methods
  async getActionPointsOrgReport(organizationId: string, filters: any = {}): Promise<any> {
    const query = this.actionPointsRepository.createQueryBuilder('actionPoint')
      .leftJoinAndSelect('actionPoint.submission', 'submission')
      .where('actionPoint.organizationId = :organizationId', { organizationId });

    // Date range filter
    if (filters.startDate) {
      query.andWhere('actionPoint.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('actionPoint.createdAt <= :endDate', { endDate: end });
    }

    // DB status filter (only for real statuses, not computed chips)
    const computedStatuses = new Set(['overdue', 'dueToday', 'onTime', 'inProgress']);
    if (filters.status && filters.status !== 'all' && !computedStatuses.has(filters.status)) {
      query.andWhere('actionPoint.status = :status', { status: filters.status });
    }
    if (filters.status === 'inProgress') {
      query.andWhere('actionPoint.status = :status', { status: 'in_progress' });
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      query.andWhere('actionPoint.priority = :priority', { priority: filters.priority });
    }

    // Store filter
    if (filters.storeId && filters.storeId !== 'all') {
      query.andWhere('actionPoint.storeId = :storeId', { storeId: filters.storeId });
    }

    // Assigned to filter
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      query.andWhere('actionPoint.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    // Search filter
    if (filters.search) {
      query.andWhere(
        '(actionPoint.title ILIKE :search OR actionPoint.description ILIKE :search OR actionPoint.assignedTo ILIKE :search OR actionPoint.id::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Trigger type filter
    if (filters.triggerType && filters.triggerType !== 'all') {
      query.andWhere('actionPoint.triggerType = :triggerType', { triggerType: filters.triggerType });
    }

    // Process filter (workflow type and workflow id)
    if (filters.workflowType) {
      query.andWhere('actionPoint.workflowType = :workflowType', { workflowType: filters.workflowType });
    }
    if (filters.workflowId) {
      query.andWhere('actionPoint.workflowId = :workflowId', { workflowId: filters.workflowId });
    }

    let actionPoints = await query.orderBy('actionPoint.createdAt', 'DESC').getMany();

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isOpenLike = (ap: ActionPoint) => !['completed', 'closed', 'rejected'].includes(ap.status);
    const isOverdue = (ap: ActionPoint) =>
      Boolean(ap.dueDate) && new Date(ap.dueDate) < now && isOpenLike(ap);
    const isDueToday = (ap: ActionPoint) => {
      if (!ap.dueDate || !isOpenLike(ap)) return false;
      const dueDate = new Date(ap.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    };
    const isOnTime = (ap: ActionPoint) => {
      if (!ap.dueDate || !isOpenLike(ap)) return false;
      return new Date(ap.dueDate) >= tomorrow;
    };

    // Apply computed status filters after fetch
    if (filters.status === 'overdue') actionPoints = actionPoints.filter(isOverdue);
    else if (filters.status === 'dueToday') actionPoints = actionPoints.filter(isDueToday);
    else if (filters.status === 'onTime') actionPoints = actionPoints.filter(isOnTime);

    // Enrich rows
    const enriched = actionPoints.map((ap) => {
      const overdue = isOverdue(ap);
      const dueToday = isDueToday(ap);
      let cycleHours: number | null = null;
      if (ap.completedAt || ap.closedAt) {
        const end = new Date(ap.closedAt || ap.completedAt);
        cycleHours = Math.max(
          0,
          Math.round(
            (end.getTime() - new Date(ap.createdAt).getTime()) / (1000 * 60 * 60),
          ),
        );
      }
      return {
        ...ap,
        isOverdue: overdue,
        isDueToday: dueToday,
        isOnTime: isOnTime(ap),
        cycleHours,
      };
    });

    // Status counts from unfiltered org set for chip totals when filtering —
    // recompute on current result set so chips reflect applied date/search filters
    const totalActionPoints = enriched.length;
    const openActionPoints = enriched.filter((ap) => ap.status === 'open').length;
    const inProgressActionPoints = enriched.filter((ap) => ap.status === 'in_progress').length;
    const onHoldActionPoints = enriched.filter((ap) => ap.status === 'on_hold').length;
    const completedActionPoints = enriched.filter((ap) => ap.status === 'completed').length;
    const closedActionPoints = enriched.filter((ap) => ap.status === 'closed').length;
    const rejectedActionPoints = enriched.filter((ap) => ap.status === 'rejected').length;
    const overdueActionPoints = enriched.filter((ap) => ap.isOverdue).length;
    const dueTodayActionPoints = enriched.filter((ap) => ap.isDueToday).length;
    const onTimeActionPoints = enriched.filter((ap) => ap.isOnTime).length;

    const resolved = completedActionPoints + closedActionPoints;
    const resolutionRate =
      totalActionPoints > 0 ? Math.round((resolved / totalActionPoints) * 100) : 0;
    const overdueRate =
      totalActionPoints > 0 ? Math.round((overdueActionPoints / totalActionPoints) * 100) : 0;
    const cycleValues = enriched
      .map((ap) => ap.cycleHours)
      .filter((v): v is number => typeof v === 'number');
    const avgCycleHours =
      cycleValues.length > 0
        ? Math.round(cycleValues.reduce((a, b) => a + b, 0) / cycleValues.length)
        : 0;

    // Assignee performance
    const assigneeMap: Record<string, any> = {};
    enriched.forEach((ap) => {
      const key = ap.assignedTo || 'Unassigned';
      if (!assigneeMap[key]) {
        assigneeMap[key] = {
          assignee: key,
          total: 0,
          open: 0,
          inProgress: 0,
          completed: 0,
          closed: 0,
          overdue: 0,
          cycleHoursSum: 0,
          cycleCount: 0,
        };
      }
      const row = assigneeMap[key];
      row.total++;
      if (ap.status === 'open') row.open++;
      if (ap.status === 'in_progress') row.inProgress++;
      if (ap.status === 'completed') row.completed++;
      if (ap.status === 'closed') row.closed++;
      if (ap.isOverdue) row.overdue++;
      if (typeof ap.cycleHours === 'number') {
        row.cycleHoursSum += ap.cycleHours;
        row.cycleCount++;
      }
    });

    const byAssignee = Object.values(assigneeMap)
      .map((row: any) => {
        const resolvedCount = row.completed + row.closed;
        return {
          assignee: row.assignee,
          total: row.total,
          open: row.open,
          inProgress: row.inProgress,
          completed: row.completed,
          closed: row.closed,
          overdue: row.overdue,
          resolutionRate: row.total > 0 ? Math.round((resolvedCount / row.total) * 100) : 0,
          overdueRate: row.total > 0 ? Math.round((row.overdue / row.total) * 100) : 0,
          avgCycleHours:
            row.cycleCount > 0 ? Math.round(row.cycleHoursSum / row.cycleCount) : 0,
        };
      })
      .sort((a: any, b: any) => b.total - a.total);

    // Trend analysis — bucket by day
    const trendMap: Record<string, { date: string; created: number; completed: number; closed: number; overdue: number }> = {};
    enriched.forEach((ap) => {
      const createdKey = new Date(ap.createdAt).toISOString().slice(0, 10);
      if (!trendMap[createdKey]) {
        trendMap[createdKey] = { date: createdKey, created: 0, completed: 0, closed: 0, overdue: 0 };
      }
      trendMap[createdKey].created++;
      if (ap.isOverdue) trendMap[createdKey].overdue++;

      if (ap.completedAt) {
        const key = new Date(ap.completedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) trendMap[key] = { date: key, created: 0, completed: 0, closed: 0, overdue: 0 };
        trendMap[key].completed++;
      }
      if (ap.closedAt) {
        const key = new Date(ap.closedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) trendMap[key] = { date: key, created: 0, completed: 0, closed: 0, overdue: 0 };
        trendMap[key].closed++;
      }
    });

    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Priority breakdown
    const byPriority = ['high', 'medium', 'low'].map((p) => ({
      priority: p,
      count: enriched.filter((ap) => (ap.priority || 'medium') === p).length,
    }));

    return {
      actionPoints: enriched,
      statusCounts: {
        total: totalActionPoints,
        open: openActionPoints,
        inProgress: inProgressActionPoints,
        onHold: onHoldActionPoints,
        completed: completedActionPoints,
        closed: closedActionPoints,
        rejected: rejectedActionPoints,
        overdue: overdueActionPoints,
        dueToday: dueTodayActionPoints,
        onTime: onTimeActionPoints,
      },
      kpis: {
        total: totalActionPoints,
        open: openActionPoints,
        inProgress: inProgressActionPoints,
        overdue: overdueActionPoints,
        resolved,
        resolutionRate,
        overdueRate,
        avgCycleHours,
        dueToday: dueTodayActionPoints,
      },
      byAssignee,
      trends,
      byPriority,
    };
  }

  async getActionPointsAdvanceReport(organizationId: string, filters: any = {}): Promise<any> {
    const query = this.actionPointsRepository.createQueryBuilder('actionPoint')
      .leftJoinAndSelect('actionPoint.submission', 'submission')
      .where('actionPoint.organizationId = :organizationId', { organizationId });

    // Date range filter
    if (filters.startDate) {
      query.andWhere('actionPoint.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      query.andWhere('actionPoint.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.andWhere('actionPoint.status = :status', { status: filters.status });
    }

    // Action Point ID search
    if (filters.actionPointId) {
      query.andWhere('actionPoint.id LIKE :actionPointId', { actionPointId: `%${filters.actionPointId}%` });
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      query.andWhere('actionPoint.priority = :priority', { priority: filters.priority });
    }

    // Store filter
    if (filters.storeId) {
      query.andWhere('actionPoint.storeId = :storeId', { storeId: filters.storeId });
    }

    // Assigned to filter
    if (filters.assignedTo) {
      query.andWhere('actionPoint.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    // Search filter
    if (filters.search) {
      query.andWhere('(actionPoint.title LIKE :search OR actionPoint.description LIKE :search)', { 
        search: `%${filters.search}%` 
      });
    }

    // Trigger type filter
    if (filters.triggerType && filters.triggerType !== 'all') {
      query.andWhere('actionPoint.triggerType = :triggerType', { triggerType: filters.triggerType });
    }

    // Process filter (workflow type and workflow id)
    if (filters.workflowType) {
      query.andWhere('actionPoint.workflowType = :workflowType', { workflowType: filters.workflowType });
    }
    if (filters.workflowId) {
      query.andWhere('actionPoint.workflowId = :workflowId', { workflowId: filters.workflowId });
    }

    const actionPoints = await query.orderBy('actionPoint.createdAt', 'DESC').getMany();

    // Track status changes over time - create timeline for each action point
    const statusChanges = actionPoints.map(ap => ({
      id: ap.id,
      title: ap.title,
      description: ap.description,
      currentStatus: ap.status,
      priority: ap.priority,
      triggerType: ap.triggerType,
      assignedTo: ap.assignedTo,
      storeId: ap.storeId,
      workflowType: ap.workflowType,
      workflowId: ap.workflowId,
      createdAt: ap.createdAt,
      updatedAt: ap.updatedAt,
      completedAt: ap.completedAt,
      closedAt: ap.closedAt,
      dueDate: ap.dueDate,
      createdBy: ap.createdBy,
      closureAssignedTo: ap.closureAssignedTo,
      submissionId: ap.submissionId,
      questionId: ap.questionId,
      // Timeline of status changes
      timeline: [
        {
          event: 'created',
          status: 'open',
          timestamp: ap.createdAt,
          user: ap.createdBy,
        },
        ...(ap.completedAt ? [{
          event: 'completed',
          status: 'completed',
          timestamp: ap.completedAt,
          user: ap.assignedTo,
        }] : []),
        ...(ap.closedAt ? [{
          event: 'closed',
          status: 'closed',
          timestamp: ap.closedAt,
          user: ap.closureAssignedTo,
        }] : []),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    }));

    return {
      actionPoints: statusChanges,
      total: statusChanges.length,
    };
  }
}
