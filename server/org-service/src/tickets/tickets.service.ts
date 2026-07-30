import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { TicketTag } from './ticket-tag.entity';
import { AutoTicketCategory } from './auto-ticket-category.entity';
import { TicketRule } from './ticket-rule.entity';
import { TicketSettings } from './ticket-settings.entity';
import { TicketClosureQuestion } from './ticket-closure-question.entity';
import {
  DEFAULT_PRIORITY_LEVELS,
  normalizePriorityLevels,
} from './ticket-priority.defaults';
import { notifyTicketAssigned } from '../shared/notification-client';

@Injectable()
export class TicketsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TicketsService.name);
  private closureRulesTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Ticket, 'org')
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(TicketTag, 'org')
    private ticketTagsRepository: Repository<TicketTag>,
    @InjectRepository(AutoTicketCategory, 'org')
    private autoTicketCategoriesRepository: Repository<AutoTicketCategory>,
    @InjectRepository(TicketRule, 'org')
    private ticketRulesRepository: Repository<TicketRule>,
    @InjectRepository(TicketSettings, 'org')
    private ticketSettingsRepository: Repository<TicketSettings>,
    @InjectRepository(TicketClosureQuestion, 'org')
    private closureQuestionsRepository: Repository<TicketClosureQuestion>,
  ) {}

  onModuleInit() {
    // Apply auto-close rules shortly after boot, then hourly.
    setTimeout(() => {
      this.applyClosureRules().catch((err) =>
        this.logger.error(`Initial closure-rules run failed: ${err?.message || err}`),
      );
    }, 20_000);
    this.closureRulesTimer = setInterval(() => {
      this.applyClosureRules().catch((err) =>
        this.logger.error(`Scheduled closure-rules run failed: ${err?.message || err}`),
      );
    }, 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.closureRulesTimer) {
      clearInterval(this.closureRulesTimer);
      this.closureRulesTimer = null;
    }
  }

  // Ticket methods
  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    if (!ticketData.organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const payload: Partial<Ticket> = { ...ticketData };
    const settings = await this.getSettings(payload.organizationId);
    const priorityLevels = normalizePriorityLevels(settings.priorityLevels);

    if (payload.ticketType === 'auto' && payload.categoryId) {
      const category = await this.autoTicketCategoriesRepository.findOne({
        where: { id: payload.categoryId },
      });
      if (category) {
        payload.priority = category.priority ?? payload.priority ?? 'medium';
        const assigneeIds = category.assigneeIds ?? [];
        if (!payload.assignedTo && assigneeIds.length > 0) {
          payload.assignedTo = assigneeIds[0];
        }
        if (!payload.assignedTeamId && Array.isArray(category.teamIds) && category.teamIds[0]) {
          payload.assignedTeamId = category.teamIds[0];
        }
        const daysFromNow = category.dueDateConfig?.daysFromNow;
        if (!payload.dueDate && typeof daysFromNow === 'number') {
          const due = new Date();
          due.setDate(due.getDate() + daysFromNow);
          payload.dueDate = due;
        }
        if (!payload.title?.trim()) {
          payload.title = category.categoryName;
        }
      }
    }

    const priorityKey = (payload.priority || 'medium') as string;
    const priorityConfig = priorityLevels.find((level) => level.key === priorityKey);
    if (priorityConfig && priorityConfig.enabled === false) {
      throw new BadRequestException(`Priority "${priorityKey}" is disabled by organization settings`);
    }
    if (!payload.dueDate && priorityConfig?.defaultDueDays != null) {
      const due = new Date();
      due.setDate(due.getDate() + priorityConfig.defaultDueDays);
      payload.dueDate = due;
    }

    if (settings.attachmentMandatory) {
      const attachments = payload.attachments;
      const hasAttachments = Array.isArray(attachments)
        ? attachments.length > 0
        : attachments && typeof attachments === 'object' && Object.keys(attachments).length > 0;
      if (!hasAttachments) {
        throw new BadRequestException('Attachment is mandatory for ticket creation');
      }
    }

    const tagDefs = await this.ticketTagsRepository.find({
      where: { organizationId: payload.organizationId, isActive: true },
    });
    const applicableTags = tagDefs.filter(
      (tag) => tag.tagType === 'ticket' || tag.tagType === 'both',
    );
    const rawTags = payload.tags;
    const tagMap: Record<string, unknown> = {};
    if (Array.isArray(rawTags)) {
      rawTags.forEach((entry: any) => {
        const name = entry?.name || entry?.tagName || entry?.key;
        if (name) tagMap[String(name)] = entry?.value ?? entry?.label ?? '';
      });
    } else if (rawTags && typeof rawTags === 'object') {
      Object.assign(tagMap, rawTags);
    }

    for (const tag of applicableTags) {
      if (!tag.isMandatory) continue;
      const value = tagMap[tag.tagName];
      if (value == null || String(value).trim() === '') {
        throw new BadRequestException(`Tag "${tag.tagName}" is mandatory`);
      }
    }

    payload.tags = Object.entries(tagMap)
      .filter(([, value]) => value != null && String(value).trim() !== '')
      .map(([name, value]) => {
        const def = applicableTags.find((tag) => tag.tagName === name);
        return {
          id: def?.id,
          name,
          value,
          type: def?.tagType || 'ticket',
        };
      });

    if (!payload.assignedTo?.trim()) {
      throw new BadRequestException('Assignee is required');
    }
    if (!payload.title?.trim()) {
      throw new BadRequestException('Title is required');
    }

    payload.actionHistory = [
      {
        action: 'created',
        userId: payload.createdBy,
        timestamp: new Date(),
      },
    ];

    const ticket = this.ticketsRepository.create(payload);
    const saved = await this.ticketsRepository.save(ticket);
    if (saved.assignedTo) {
      notifyTicketAssigned({
        userId: saved.assignedTo,
        ticketId: saved.id,
        ticketTitle: saved.title,
        assignedBy: saved.createdBy,
      });
    }
    return saved;
  }

  async findAll(organizationId: string, startDate?: Date, endDate?: Date): Promise<Ticket[]> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('ticket.createdAt <= :endDate', { endDate: end });
    }

    return query.orderBy('ticket.createdAt', 'DESC').getMany();
  }

  async findAssignedToMe(userId: string, organizationId: string): Promise<Ticket[]> {
    return await this.ticketsRepository.find({
      where: { organizationId, assignedTo: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findCreatedByMe(userId: string, organizationId: string): Promise<Ticket[]> {
    return await this.ticketsRepository.find({
      where: { organizationId, createdBy: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ticket> {
    return await this.ticketsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, ticketData: Partial<Ticket>, requestingUserId?: string): Promise<Ticket> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Ticket not found');

    if (requestingUserId && existing.createdBy !== requestingUserId) {
      throw new ForbiddenException('Only the creator can edit this ticket');
    }

    await this.ticketsRepository.update(id, ticketData);
    const updated = await this.findOne(id);
    if (ticketData.assignedTo && ticketData.assignedTo !== existing?.assignedTo) {
      notifyTicketAssigned({
        userId: ticketData.assignedTo,
        ticketId: id,
        ticketTitle: updated.title,
        assignedBy: updated.updatedBy || updated.createdBy,
      });
    }
    return updated;
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    options?: { closureAnswers?: Record<string, unknown>; skipClosureQuestions?: boolean },
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.createdBy !== userId && ticket.assignedTo !== userId) {
      throw new ForbiddenException('Only the creator or assignee can change the ticket status');
    }

    const actionHistory = ticket.actionHistory || [];
    actionHistory.push({
      action: 'status_change',
      from: ticket.status,
      to: status,
      userId,
      timestamp: new Date(),
    });

    const updateData: any = { status, actionHistory };

    if (status === 'in_progress' && !ticket.claimedAt) {
      updateData.claimedAt = new Date();
    } else if (status === 'complete') {
      updateData.completedAt = new Date();
    } else if (status === 'closed') {
      if (!options?.skipClosureQuestions) {
        const questions = await this.findActiveClosureQuestions(ticket.organizationId);
        const answers = options?.closureAnswers || {};
        for (const question of questions) {
          if (!question.isRequired) continue;
          const answer = answers[question.id];
          if (answer == null || String(answer).trim() === '') {
            throw new BadRequestException(
              `Please answer required closure question: ${question.questionText}`,
            );
          }
        }
        updateData.closureAnswers = answers;
      } else if (options?.closureAnswers) {
        updateData.closureAnswers = options.closureAnswers;
      }
      updateData.closedAt = new Date();
    }

    return await this.update(id, updateData);
  }

  async addComment(id: string, comment: any): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new Error('Ticket not found');

    const comments = ticket.comments || [];
    comments.push(comment);

    return await this.update(id, { comments });
  }

  async remove(id: string, userId?: string): Promise<void> {
    const ticket = await this.findOne(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (ticket.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can delete this ticket');
    }

    const settings = await this.getSettings(ticket.organizationId);
    if (settings.disableTicketDelete) {
      throw new BadRequestException('Ticket deletion is disabled by organization settings');
    }

    await this.ticketsRepository.delete(id);
  }

  async getSettings(organizationId: string): Promise<TicketSettings> {
    let settings = await this.ticketSettingsRepository.findOne({
      where: { organizationId },
    });

    if (!settings) {
      settings = await this.ticketSettingsRepository.save(
        this.ticketSettingsRepository.create({
          organizationId,
          priorityLevels: DEFAULT_PRIORITY_LEVELS,
        }),
      );
    }

    settings.priorityLevels = normalizePriorityLevels(settings.priorityLevels);
    return settings;
  }

  async updateSettings(
    organizationId: string,
    data: Partial<TicketSettings>,
  ): Promise<TicketSettings> {
    const settings = await this.getSettings(organizationId);
    await this.ticketSettingsRepository.update(settings.id, {
      attachmentMandatory: data.attachmentMandatory ?? settings.attachmentMandatory,
      disableTicketDelete: data.disableTicketDelete ?? settings.disableTicketDelete,
      hidePriorities: data.hidePriorities ?? settings.hidePriorities,
      priorityLevels: data.priorityLevels
        ? normalizePriorityLevels(data.priorityLevels)
        : settings.priorityLevels,
    });
    return this.getSettings(organizationId);
  }

  // Ticket Tag methods
  async createTag(tagData: Partial<TicketTag>): Promise<TicketTag> {
    const tag = this.ticketTagsRepository.create(tagData);
    return await this.ticketTagsRepository.save(tag);
  }

  async findAllTags(organizationId: string): Promise<TicketTag[]> {
    return await this.ticketTagsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTag(id: string, tagData: Partial<TicketTag>): Promise<TicketTag> {
    await this.ticketTagsRepository.update(id, tagData);
    return await this.ticketTagsRepository.findOne({ where: { id } });
  }

  async removeTag(id: string): Promise<void> {
    await this.ticketTagsRepository.delete(id);
  }

  // Auto Ticket Category methods
  async createCategory(categoryData: Partial<AutoTicketCategory>): Promise<AutoTicketCategory> {
    const category = this.autoTicketCategoriesRepository.create(categoryData);
    return await this.autoTicketCategoriesRepository.save(category);
  }

  async findAllCategories(organizationId: string): Promise<AutoTicketCategory[]> {
    return await this.autoTicketCategoriesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCategory(id: string, categoryData: Partial<AutoTicketCategory>): Promise<AutoTicketCategory> {
    await this.autoTicketCategoriesRepository.update(id, categoryData);
    return await this.autoTicketCategoriesRepository.findOne({ where: { id } });
  }

  async removeCategory(id: string): Promise<void> {
    await this.autoTicketCategoriesRepository.delete(id);
  }

  // Ticket Rule methods
  async createRule(ruleData: Partial<TicketRule>): Promise<TicketRule> {
    const rule = this.ticketRulesRepository.create(ruleData);
    return await this.ticketRulesRepository.save(rule);
  }

  async findAllRules(organizationId: string): Promise<TicketRule[]> {
    return await this.ticketRulesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateRule(id: string, ruleData: Partial<TicketRule>): Promise<TicketRule> {
    await this.ticketRulesRepository.update(id, ruleData);
    return await this.ticketRulesRepository.findOne({ where: { id } });
  }

  async removeRule(id: string): Promise<void> {
    await this.ticketRulesRepository.delete(id);
  }

  // Closure question methods
  async createClosureQuestion(
    data: Partial<TicketClosureQuestion>,
  ): Promise<TicketClosureQuestion> {
    if (!data.organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (!data.questionText?.trim()) {
      throw new BadRequestException('questionText is required');
    }
    const question = this.closureQuestionsRepository.create({
      questionText: data.questionText.trim(),
      questionType: data.questionType || 'text',
      options: data.options || [],
      isRequired: data.isRequired ?? true,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
      organizationId: data.organizationId,
    });
    return this.closureQuestionsRepository.save(question);
  }

  async findAllClosureQuestions(organizationId: string): Promise<TicketClosureQuestion[]> {
    return this.closureQuestionsRepository.find({
      where: { organizationId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findActiveClosureQuestions(organizationId: string): Promise<TicketClosureQuestion[]> {
    return this.closureQuestionsRepository.find({
      where: { organizationId, isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async updateClosureQuestion(
    id: string,
    data: Partial<TicketClosureQuestion>,
  ): Promise<TicketClosureQuestion> {
    const existing = await this.closureQuestionsRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Closure question not found');
    await this.closureQuestionsRepository.update(id, {
      questionText: data.questionText ?? existing.questionText,
      questionType: data.questionType ?? existing.questionType,
      options: data.options ?? existing.options,
      isRequired: data.isRequired ?? existing.isRequired,
      isActive: data.isActive ?? existing.isActive,
      displayOrder: data.displayOrder ?? existing.displayOrder,
    });
    return this.closureQuestionsRepository.findOne({ where: { id } });
  }

  async removeClosureQuestion(id: string): Promise<void> {
    await this.closureQuestionsRepository.delete(id);
  }

  async applyClosureRules(organizationId?: string): Promise<{ closedCount: number }> {
    const rules = await this.ticketRulesRepository.find({
      where: organizationId
        ? { organizationId, isActive: true }
        : { isActive: true },
    });

    let closedCount = 0;
    const now = Date.now();

    for (const rule of rules) {
      const targetStatuses = Array.isArray(rule.targetStatuses) ? rule.targetStatuses : [];
      if (!targetStatuses.length || !rule.daysAfter || rule.daysAfter < 0) continue;

      const tickets = await this.ticketsRepository.find({
        where: {
          organizationId: rule.organizationId,
          status: In(targetStatuses),
        },
      });

      for (const ticket of tickets) {
        if (ticket.status === 'closed') continue;
        const baseDate =
          rule.ruleType === 'completed_at' ? ticket.completedAt : ticket.createdAt;
        if (!baseDate) continue;

        const deadline = new Date(baseDate);
        deadline.setDate(deadline.getDate() + Number(rule.daysAfter));
        if (now < deadline.getTime()) continue;

        await this.updateStatus(ticket.id, 'closed', 'system-auto-close', {
          skipClosureQuestions: true,
          closureAnswers: {
            _autoClosed: true,
            ruleId: rule.id,
            ruleType: rule.ruleType,
            daysAfter: rule.daysAfter,
            closedAt: new Date().toISOString(),
          },
        });
        closedCount += 1;
      }
    }

    if (closedCount > 0) {
      this.logger.log(`Auto-closed ${closedCount} ticket(s) via closure rules`);
    }
    return { closedCount };
  }

  // Ticket Report methods
  async getTicketOrgReport(organizationId: string, filters: any = {}): Promise<any> {
    const query = this.ticketsRepository.createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId });

    if (filters.startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('ticket.createdAt <= :endDate', { endDate: end });
    }

    const computedStatuses = new Set(['overdue', 'dueToday', 'onTime', 'inProgress']);
    if (filters.status && filters.status !== 'all' && !computedStatuses.has(filters.status)) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters.status === 'inProgress') {
      query.andWhere('ticket.status = :status', { status: 'in_progress' });
    }
    if (filters.priority && filters.priority !== 'all') {
      query.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }
    if (filters.storeId && filters.storeId !== 'all') {
      query.andWhere('ticket.storeId = :storeId', { storeId: filters.storeId });
    }
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      query.andWhere('ticket.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.categoryId && filters.categoryId !== 'all') {
      query.andWhere('ticket.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.search) {
      query.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search OR ticket.assignedTo ILIKE :search OR ticket.id::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    let tickets = await query.orderBy('ticket.createdAt', 'DESC').getMany();

    const categories = await this.autoTicketCategoriesRepository.find({ where: { organizationId } });
    const categoryNameById: Record<string, string> = {};
    categories.forEach((c) => {
      categoryNameById[c.id] = c.categoryName || c.id;
    });

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isOpenLike = (t: Ticket) => !['complete', 'closed', 'rejected'].includes(t.status);
    const isOverdue = (t: Ticket) =>
      Boolean(t.dueDate) && new Date(t.dueDate) < now && isOpenLike(t);
    const isDueToday = (t: Ticket) => {
      if (!t.dueDate || !isOpenLike(t)) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    };
    const isOnTime = (t: Ticket) => {
      if (!t.dueDate || !isOpenLike(t)) return false;
      return new Date(t.dueDate) >= tomorrow;
    };
    const resolveVendor = (t: Ticket): string => {
      const costs = t.costs;
      if (costs && typeof costs === 'object') {
        const name = costs.vendor || costs.vendorName || costs.vendorId;
        if (name) return String(name);
      }
      if (Array.isArray(t.tags)) {
        const vendorTag = t.tags.find(
          (tag: any) =>
            tag &&
            (String(tag.type || '').toLowerCase() === 'vendor' ||
              String(tag.key || '').toLowerCase() === 'vendor'),
        );
        if (vendorTag?.value || vendorTag?.name || vendorTag?.label) {
          return String(vendorTag.value || vendorTag.name || vendorTag.label);
        }
      }
      return 'Unassigned Vendor';
    };

    if (filters.status === 'overdue') tickets = tickets.filter(isOverdue);
    else if (filters.status === 'dueToday') tickets = tickets.filter(isDueToday);
    else if (filters.status === 'onTime') tickets = tickets.filter(isOnTime);

    if (filters.vendor && filters.vendor !== 'all') {
      tickets = tickets.filter((t) => resolveVendor(t) === filters.vendor);
    }

    const enriched = tickets.map((t) => {
      let cycleHours: number | null = null;
      if (t.completedAt || t.closedAt) {
        const end = new Date(t.closedAt || t.completedAt);
        cycleHours = Math.max(
          0,
          Math.round((end.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)),
        );
      }
      const vendor = resolveVendor(t);
      const categoryName = t.categoryId
        ? categoryNameById[t.categoryId] || t.categoryId
        : 'Uncategorized';
      return {
        ...t,
        isOverdue: isOverdue(t),
        isDueToday: isDueToday(t),
        isOnTime: isOnTime(t),
        cycleHours,
        vendor,
        categoryName,
      };
    });

    const totalTickets = enriched.length;
    const openTickets = enriched.filter((t) => t.status === 'open').length;
    const inProgressTickets = enriched.filter((t) => t.status === 'in_progress').length;
    const onHoldTickets = enriched.filter((t) => t.status === 'on_hold').length;
    const completeTickets = enriched.filter((t) => t.status === 'complete').length;
    const closedTickets = enriched.filter((t) => t.status === 'closed').length;
    const rejectedTickets = enriched.filter((t) => t.status === 'rejected').length;
    const overdueTickets = enriched.filter((t) => t.isOverdue).length;
    const dueTodayTickets = enriched.filter((t) => t.isDueToday).length;
    const onTimeTickets = enriched.filter((t) => t.isOnTime).length;

    const resolved = completeTickets + closedTickets;
    const resolutionRate =
      totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0;
    const overdueRate =
      totalTickets > 0 ? Math.round((overdueTickets / totalTickets) * 100) : 0;
    const cycleValues = enriched
      .map((t) => t.cycleHours)
      .filter((v): v is number => typeof v === 'number');
    const avgCycleHours =
      cycleValues.length > 0
        ? Math.round(cycleValues.reduce((a, b) => a + b, 0) / cycleValues.length)
        : 0;
    const medianCycleHours = (() => {
      if (cycleValues.length === 0) return 0;
      const sorted = [...cycleValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    })();

    const buildPerf = (keyFn: (t: any) => string, labelKey: string) => {
      const map: Record<string, any> = {};
      enriched.forEach((t) => {
        const key = keyFn(t) || 'Unassigned';
        if (!map[key]) {
          map[key] = {
            [labelKey]: key,
            total: 0,
            open: 0,
            inProgress: 0,
            complete: 0,
            closed: 0,
            overdue: 0,
            cycleHoursSum: 0,
            cycleCount: 0,
          };
        }
        const row = map[key];
        row.total++;
        if (t.status === 'open') row.open++;
        if (t.status === 'in_progress') row.inProgress++;
        if (t.status === 'complete') row.complete++;
        if (t.status === 'closed') row.closed++;
        if (t.isOverdue) row.overdue++;
        if (typeof t.cycleHours === 'number') {
          row.cycleHoursSum += t.cycleHours;
          row.cycleCount++;
        }
      });
      return Object.values(map)
        .map((row: any) => {
          const resolvedCount = row.complete + row.closed;
          return {
            [labelKey]: row[labelKey],
            total: row.total,
            open: row.open,
            inProgress: row.inProgress,
            complete: row.complete,
            closed: row.closed,
            overdue: row.overdue,
            resolutionRate: row.total > 0 ? Math.round((resolvedCount / row.total) * 100) : 0,
            overdueRate: row.total > 0 ? Math.round((row.overdue / row.total) * 100) : 0,
            avgCycleHours:
              row.cycleCount > 0 ? Math.round(row.cycleHoursSum / row.cycleCount) : 0,
          };
        })
        .sort((a: any, b: any) => b.total - a.total);
    };

    const byAssignee = buildPerf((t) => t.assignedTo || 'Unassigned', 'assignee');
    const byVendor = buildPerf((t) => t.vendor || 'Unassigned Vendor', 'vendor');
    const byCategory = buildPerf((t) => t.categoryName || 'Uncategorized', 'category');

    const trendMap: Record<
      string,
      { date: string; created: number; completed: number; closed: number; overdue: number }
    > = {};
    enriched.forEach((t) => {
      const createdKey = new Date(t.createdAt).toISOString().slice(0, 10);
      if (!trendMap[createdKey]) {
        trendMap[createdKey] = { date: createdKey, created: 0, completed: 0, closed: 0, overdue: 0 };
      }
      trendMap[createdKey].created++;
      if (t.isOverdue) trendMap[createdKey].overdue++;
      if (t.completedAt) {
        const key = new Date(t.completedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) {
          trendMap[key] = { date: key, created: 0, completed: 0, closed: 0, overdue: 0 };
        }
        trendMap[key].completed++;
      }
      if (t.closedAt) {
        const key = new Date(t.closedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) {
          trendMap[key] = { date: key, created: 0, completed: 0, closed: 0, overdue: 0 };
        }
        trendMap[key].closed++;
      }
    });
    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    const byPriorityList = ['highest', 'high', 'medium', 'low', 'lowest'].map((p) => ({
      priority: p,
      count: enriched.filter((t) => (t.priority || 'medium') === p).length,
    }));

    const byPriority = enriched.reduce((acc, ticket) => {
      const priority = ticket.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = enriched.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStore = enriched.reduce((acc, ticket) => {
      acc[ticket.storeId] = (acc[ticket.storeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolutionBuckets = [
      { bucket: '0-8h', count: 0 },
      { bucket: '8-24h', count: 0 },
      { bucket: '1-3d', count: 0 },
      { bucket: '3-7d', count: 0 },
      { bucket: '7d+', count: 0 },
    ];
    cycleValues.forEach((h) => {
      if (h <= 8) resolutionBuckets[0].count++;
      else if (h <= 24) resolutionBuckets[1].count++;
      else if (h <= 72) resolutionBuckets[2].count++;
      else if (h <= 168) resolutionBuckets[3].count++;
      else resolutionBuckets[4].count++;
    });

    return {
      // Backward-compatible summary fields
      totalTickets,
      openTickets,
      inProgressTickets,
      onHoldTickets,
      completeTickets,
      closedTickets,
      rejectedTickets,
      overdueTickets,
      byPriority,
      byStatus,
      byStore,
      // Enriched report payload
      tickets: enriched,
      statusCounts: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        onHold: onHoldTickets,
        complete: completeTickets,
        closed: closedTickets,
        rejected: rejectedTickets,
        overdue: overdueTickets,
        dueToday: dueTodayTickets,
        onTime: onTimeTickets,
      },
      kpis: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        overdue: overdueTickets,
        resolved,
        resolutionRate,
        overdueRate,
        avgCycleHours,
        medianCycleHours,
        dueToday: dueTodayTickets,
      },
      byAssignee,
      byVendor,
      byCategory,
      byPriorityList,
      trends,
      resolutionBuckets,
      categories: categories.map((c) => ({ id: c.id, name: c.categoryName })),
    };
  }

  async getTicketAdvanceSearch(organizationId: string, filters: any): Promise<Ticket[]> {
    const query = this.ticketsRepository.createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId });

    if (filters.ticketId) {
      query.andWhere('ticket.id LIKE :ticketId', { ticketId: `%${filters.ticketId}%` });
    }
    if (filters.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      query.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }
    if (filters.storeId) {
      query.andWhere('ticket.storeId = :storeId', { storeId: filters.storeId });
    }
    if (filters.assignedTo) {
      query.andWhere('ticket.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.createdBy) {
      query.andWhere('ticket.createdBy = :createdBy', { createdBy: filters.createdBy });
    }
    if (filters.startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      query.andWhere('ticket.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }
    if (filters.dueDateFrom) {
      query.andWhere('ticket.dueDate >= :dueDateFrom', { dueDateFrom: new Date(filters.dueDateFrom) });
    }
    if (filters.dueDateTo) {
      query.andWhere('ticket.dueDate <= :dueDateTo', { dueDateTo: new Date(filters.dueDateTo) });
    }

    return await query.orderBy('ticket.createdAt', 'DESC').getMany();
  }

  async getTicketTagReport(organizationId: string, tagId?: string): Promise<any> {
    const query = this.ticketsRepository.createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId });

    const tickets = await query.orderBy('ticket.createdAt', 'DESC').getMany();

    // Group by tags
    const byTag = tickets.reduce((acc, ticket) => {
      const tags = ticket.tags || [];
      tags.forEach((tag: any) => {
        const tagKey = tag.id || tag.name;
        if (!acc[tagKey]) {
          acc[tagKey] = {
            tagId: tag.id,
            tagName: tag.name,
            count: 0,
            tickets: [],
          };
        }
        acc[tagKey].count++;
        acc[tagKey].tickets.push(ticket);
      });
      return acc;
    }, {} as Record<string, any>);

    // Filter by specific tag if provided
    if (tagId) {
      const filtered = byTag[tagId];
      return filtered ? { [tagId]: filtered } : {};
    }

    return byTag;
  }
}
