import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionPoint } from './action-point.entity';

@Injectable()
export class ActionPointsService {
  constructor(
    @InjectRepository(ActionPoint)
    private actionPointsRepository: Repository<ActionPoint>,
  ) {}

  async create(actionPointData: Partial<ActionPoint>): Promise<ActionPoint> {
    const actionPoint = this.actionPointsRepository.create(actionPointData);
    return await this.actionPointsRepository.save(actionPoint);
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
    await this.actionPointsRepository.update(id, actionPointData);
    return await this.findOne(id);
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
      query.andWhere('actionPoint.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.andWhere('actionPoint.status = :status', { status: filters.status });
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

    // Calculate analytics for status bar
    const totalActionPoints = actionPoints.length;
    const openActionPoints = actionPoints.filter(ap => ap.status === 'open').length;
    const inProgressActionPoints = actionPoints.filter(ap => ap.status === 'in_progress').length;
    const onHoldActionPoints = actionPoints.filter(ap => ap.status === 'on_hold').length;
    const completedActionPoints = actionPoints.filter(ap => ap.status === 'completed').length;
    const closedActionPoints = actionPoints.filter(ap => ap.status === 'closed').length;
    const rejectedActionPoints = actionPoints.filter(ap => ap.status === 'rejected').length;

    // Overdue action points
    const now = new Date();
    const overdueActionPoints = actionPoints.filter(ap => ap.dueDate && new Date(ap.dueDate) < now && !['completed', 'closed'].includes(ap.status)).length;

    // Due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueTodayActionPoints = actionPoints.filter(ap => {
      if (!ap.dueDate) return false;
      const dueDate = new Date(ap.dueDate);
      return dueDate >= today && dueDate < tomorrow && !['completed', 'closed'].includes(ap.status);
    }).length;

    // On time (not overdue and not due today)
    const onTimeActionPoints = actionPoints.filter(ap => {
      if (!ap.dueDate) return false;
      const dueDate = new Date(ap.dueDate);
      return dueDate >= tomorrow && !['completed', 'closed'].includes(ap.status);
    }).length;

    return {
      actionPoints,
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
