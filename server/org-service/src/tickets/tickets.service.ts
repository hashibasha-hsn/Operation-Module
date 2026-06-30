import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { TicketTag } from './ticket-tag.entity';
import { AutoTicketCategory } from './auto-ticket-category.entity';
import { TicketRule } from './ticket-rule.entity';
import { TicketSettings } from './ticket-settings.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(TicketTag)
    private ticketTagsRepository: Repository<TicketTag>,
    @InjectRepository(AutoTicketCategory)
    private autoTicketCategoriesRepository: Repository<AutoTicketCategory>,
    @InjectRepository(TicketRule)
    private ticketRulesRepository: Repository<TicketRule>,
    @InjectRepository(TicketSettings)
    private ticketSettingsRepository: Repository<TicketSettings>,
  ) {}

  // Ticket methods
  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    const payload: Partial<Ticket> = { ...ticketData };

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

    const settings = await this.getSettings(payload.organizationId);
    if (settings.attachmentMandatory) {
      const attachments = payload.attachments;
      const hasAttachments = Array.isArray(attachments)
        ? attachments.length > 0
        : attachments && typeof attachments === 'object' && Object.keys(attachments).length > 0;
      if (!hasAttachments) {
        throw new BadRequestException('Attachment is mandatory for ticket creation');
      }
    }

    payload.actionHistory = [
      {
        action: 'created',
        userId: payload.createdBy,
        timestamp: new Date(),
      },
    ];

    const ticket = this.ticketsRepository.create(payload);
    return await this.ticketsRepository.save(ticket);
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

  async update(id: string, ticketData: Partial<Ticket>): Promise<Ticket> {
    await this.ticketsRepository.update(id, ticketData);
    return await this.findOne(id);
  }

  async updateStatus(id: string, status: string, userId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new Error('Ticket not found');

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
        this.ticketSettingsRepository.create({ organizationId }),
      );
    }

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

  // Ticket Report methods
  async getTicketOrgReport(organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.ticketsRepository.createQueryBuilder('ticket')
      .where('ticket.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('ticket.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('ticket.createdAt <= :endDate', { endDate });
    }

    const tickets = await query.orderBy('ticket.createdAt', 'DESC').getMany();

    // Calculate analytics
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const onHoldTickets = tickets.filter(t => t.status === 'on_hold').length;
    const completeTickets = tickets.filter(t => t.status === 'complete').length;
    const closedTickets = tickets.filter(t => t.status === 'closed').length;
    const rejectedTickets = tickets.filter(t => t.status === 'rejected').length;

    // Priority distribution
    const byPriority = tickets.reduce((acc, ticket) => {
      const priority = ticket.priority;
      if (!acc[priority]) {
        acc[priority] = 0;
      }
      acc[priority]++;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const byStatus = tickets.reduce((acc, ticket) => {
      const status = ticket.status;
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {} as Record<string, number>);

    // By store
    const byStore = tickets.reduce((acc, ticket) => {
      const storeId = ticket.storeId;
      if (!acc[storeId]) {
        acc[storeId] = 0;
      }
      acc[storeId]++;
      return acc;
    }, {} as Record<string, number>);

    // Overdue tickets
    const now = new Date();
    const overdueTickets = tickets.filter(t => t.dueDate && new Date(t.dueDate) < now && !['complete', 'closed'].includes(t.status)).length;

    return {
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
