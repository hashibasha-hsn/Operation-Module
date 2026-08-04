import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Audit } from './audit.entity';
import { AuditSection } from './audit-section.entity';
import { AuditQuestion } from './audit-question.entity';
import { SaveAuditDraftDto } from './save-audit-draft.dto';
import { AuditLogClient } from '../shared/audit-log.client';
import { notifyAuditAssigned } from '../shared/notification-client';

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit, 'org')
    private auditsRepository: Repository<Audit>,
    @InjectRepository(AuditSection, 'org')
    private sectionsRepository: Repository<AuditSection>,
    @InjectRepository(AuditQuestion, 'org')
    private questionsRepository: Repository<AuditQuestion>,
    @InjectDataSource('org')
    private readonly dataSource: DataSource,
    private readonly auditLogClient: AuditLogClient,
  ) {}

  private async logAuditAction(
    audit: Partial<Audit> | null | undefined,
    operation: string,
    actor?: string | null,
  ) {
    try {
      const performedBy = await this.auditLogClient.resolveEmail(
        actor || audit?.createdBy || audit?.updatedBy || 'system',
      );
      await this.auditLogClient.log({
        target: 'Audit',
        operation,
        performedBy,
        details: {
          title: audit?.title || 'Untitled Audit',
          workflowType: 'audit',
          status: audit?.status,
        },
        targetId: audit?.id,
        organizationId: audit?.organizationId || 'default-org',
      });
    } catch (error) {
      console.error('Failed to write audit CRUD log:', error);
    }
  }

  async saveDraft(dto: SaveAuditDraftDto): Promise<Audit> {
    if (!dto.title?.trim()) {
      throw new Error('Audit title is required');
    }

    const auditId = await this.dataSource.transaction(async (manager) => {
      const auditRepo = manager.getRepository(Audit);
      const sectionRepo = manager.getRepository(AuditSection);
      const questionRepo = manager.getRepository(AuditQuestion);

      const auditPayload: Partial<Audit> = {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        processTags: dto.processTags ?? [],
        processTag: dto.processTags?.[0] ?? dto.processTag ?? null,
        organizationId: dto.organizationId,
        createdBy: dto.createdBy ?? null,
        status: 'draft',
        properties: dto.properties ?? null,
        frequency: dto.frequency ?? null,
        frequencyConfig: dto.frequencyConfig ?? null,
        reminderConfig: dto.reminderConfig ?? null,
        scoringConfig: dto.scoringConfig ?? null,
        passThreshold: dto.passThreshold ?? null,
        reviewLevels: dto.reviewLevels ?? 1,
        requiresApproval: dto.requiresApproval ?? true,
        assigneeIds: dto.assigneeIds ?? [],
        storeIds: dto.storeIds ?? [],
      };

      let audit: Audit;
      if (dto.id) {
        const existing = await auditRepo.findOne({ where: { id: dto.id } });
        if (!existing) {
          throw new NotFoundException(`Audit ${dto.id} not found`);
        }
        await auditRepo.update(dto.id, auditPayload);
        await sectionRepo.delete({ auditId: dto.id });
        audit = await auditRepo.findOne({ where: { id: dto.id } });
      } else {
        audit = await auditRepo.save(auditRepo.create(auditPayload));
      }

      const criticalQuestionIds: string[] = [];

      for (const [sectionIndex, sectionDto] of (dto.sections ?? []).entries()) {
        const section = await sectionRepo.save(
          sectionRepo.create({
            title: sectionDto.title?.trim() || `Section ${sectionIndex + 1}`,
            description: sectionDto.description?.trim() ?? '',
            displayOrder: sectionDto.displayOrder ?? sectionIndex,
            maxScore: sectionDto.maxScore ?? null,
            weight: sectionDto.weight ?? null,
            auditId: audit.id,
          }),
        );

        for (const [questionIndex, questionDto] of (sectionDto.questions ?? []).entries()) {
          const question = await questionRepo.save(
            questionRepo.create({
              questionText: questionDto.questionText?.trim() || 'Untitled question',
              questionType: questionDto.questionType,
              options: questionDto.options ?? null,
              isRequired: questionDto.isRequired ?? false,
              validationRules: questionDto.validationRules ?? null,
              displayOrder: questionDto.displayOrder ?? questionIndex,
              isCritical: questionDto.isCritical ?? false,
              maxScore: questionDto.maxScore ?? null,
              weight: questionDto.weight ?? null,
              sectionId: section.id,
            }),
          );
          if (question.isCritical) {
            criticalQuestionIds.push(question.id);
          }
        }
      }

      if (criticalQuestionIds.length > 0) {
        await auditRepo.update(audit.id, { criticalQuestionIds });
      }

      return audit.id;
    });

    const saved = await this.findOneWithSections(auditId);
    await this.logAuditAction(
      saved,
      dto.id ? 'Update' : 'Create',
      dto.createdBy || saved?.createdBy,
    );
    return saved;
  }

  async findPublished(organizationId: string): Promise<Audit[]> {
    return this.auditsRepository.find({
      where: { organizationId, status: 'published', isActive: true },
      order: { title: 'ASC' },
    });
  }

  async findAssignedToUser(
    userId: string,
    storeId: string | undefined,
    organizationId: string,
  ): Promise<Audit[]> {
    const published = await this.findPublished(organizationId);
    return published.filter(
      (audit) =>
        audit.assigneeIds?.includes(userId) ||
        (storeId && audit.storeIds?.includes(storeId)),
    );
  }

  async assignUserToAudits(userId: string, auditIds: string[]): Promise<void> {
    for (const auditId of auditIds) {
      const audit = await this.findOne(auditId);
      const assigneeIds = [...new Set([...(audit.assigneeIds ?? []), userId])];
      await this.auditsRepository.update(auditId, { assigneeIds });
      notifyAuditAssigned({ userId, auditId, auditTitle: audit.title, assignedBy: audit.updatedBy || audit.createdBy });
    }
  }

  async autoAssignUserToAudits(body: {
    userId: string;
    designation?: string;
    storeId?: string;
    organizationId?: string;
  }): Promise<{ matched: number; auditIds: string[] }> {
    const orgId = body.organizationId ?? 'default-org';
    const published = await this.auditsRepository.find({
      where: { organizationId: orgId, status: 'published', isActive: true },
    });

    const matches: Audit[] = [];
    for (const audit of published) {
      const props = (audit.properties ?? {}) as Record<string, unknown>;
      if (props.dynamicAssignment !== true) continue;

      const storeIds = audit.storeIds ?? [];
      const storeMatch = storeIds.length === 0 || (body.storeId ? storeIds.includes(body.storeId) : false);
      if (!storeMatch) continue;

      const designations: string[] = ((props.assignedDesignations as string[]) ?? []).filter(Boolean);
      const designationMatch =
        designations.length === 0 ||
        (body.designation
          ? designations.some((d) => String(d).trim().toLowerCase() === body.designation!.trim().toLowerCase())
          : false);
      if (!designationMatch) continue;

      matches.push(audit);
    }

    for (const audit of matches) {
      const assigneeIds = [...new Set([...(audit.assigneeIds ?? []), body.userId])];
      await this.auditsRepository.update(audit.id, { assigneeIds });
      notifyAuditAssigned({
        userId: body.userId,
        auditId: audit.id,
        auditTitle: audit.title,
        assignedBy: body.userId,
      });
    }

    return { matched: matches.length, auditIds: matches.map((a) => a.id) };
  }

  async createAuditSetup(data: {
    title: string;
    description: string;
    processTag: string;
    organizationId: string;
    createdBy: string;
  }): Promise<Audit> {
    const audit = this.auditsRepository.create({
      ...data,
      status: 'draft',
      frequency: 'custom',
      isActive: true,
      requiresApproval: false,
      assigneeIds: [],
      storeIds: [],
    });
    const saved = await this.auditsRepository.save(audit);
    await this.logAuditAction(saved, 'Create', data.createdBy);
    return saved;
  }

  async updateAuditBasicInfo(id: string, data: {
    title?: string;
    description?: string;
    processTag?: string;
  }): Promise<Audit> {
    await this.auditsRepository.update(id, data);
    const updated = await this.findOne(id);
    await this.logAuditAction(updated, 'Update', updated.updatedBy || updated.createdBy);
    return updated;
  }

  async updateAuditProperties(id: string, data: {
    status?: string;
    frequency?: string;
    frequencyConfig?: any;
    visibilityRules?: any;
    reminderConfig?: any;
    scoringConfig?: any;
    passThreshold?: number;
    reviewLevels?: number;
    properties?: Record<string, unknown>;
    requiresApproval?: boolean;
  }): Promise<Audit> {
    const existing = await this.findOne(id);
    const mergedProperties = {
      ...(existing.properties ?? {}),
      ...(data.properties ?? {}),
    };
    await this.auditsRepository.update(id, {
      frequency: data.frequency ?? existing.frequency,
      frequencyConfig: data.frequencyConfig ?? existing.frequencyConfig,
      visibilityRules: data.visibilityRules ?? existing.visibilityRules,
      reminderConfig: data.reminderConfig ?? existing.reminderConfig,
      scoringConfig: data.scoringConfig ?? existing.scoringConfig,
      passThreshold: data.passThreshold ?? existing.passThreshold,
      reviewLevels: data.reviewLevels ?? existing.reviewLevels,
      requiresApproval: data.requiresApproval ?? existing.requiresApproval,
      properties: Object.keys(mergedProperties).length ? mergedProperties : existing.properties,
    });
    const updated = await this.findOne(id);
    await this.logAuditAction(updated, 'Update', updated.updatedBy || updated.createdBy);
    return updated;
  }

  async updateAuditAssignment(id: string, data: {
    assigneeIds?: string[];
    storeIds?: string[];
  }): Promise<Audit> {
    const audit = await this.findOne(id);
    const oldAssigneeIds = audit.assigneeIds ?? [];
    await this.auditsRepository.update(id, data);
    const updated = await this.findOne(id);
    const newAssigneeIds = updated.assigneeIds ?? [];
    const added = newAssigneeIds.filter((uid) => !oldAssigneeIds.includes(uid));
    for (const uid of added) {
      notifyAuditAssigned({ userId: uid, auditId: id, auditTitle: updated.title, assignedBy: updated.updatedBy || updated.createdBy });
    }
    await this.logAuditAction(updated, 'Update', updated.updatedBy || updated.createdBy);
    return updated;
  }

  async create(auditData: Partial<Audit>): Promise<Audit> {
    const audit = this.auditsRepository.create(auditData);
    const saved = await this.auditsRepository.save(audit);
    await this.logAuditAction(saved, 'Create', auditData.createdBy);
    return saved;
  }

  async findAll(organizationId: string): Promise<Audit[]> {
    return await this.auditsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Audit> {
    const audit = await this.auditsRepository.findOne({ where: { id } });
    if (!audit) {
      throw new NotFoundException(`Audit ${id} not found`);
    }
    return audit;
  }

  async findOneWithSections(id: string): Promise<Audit> {
    const audit = await this.auditsRepository.findOne({
      where: { id },
    });
    if (!audit) return null;

    const sections = await this.sectionsRepository.find({
      where: { auditId: id },
      order: { displayOrder: 'ASC' },
    });

    for (const section of sections) {
      const questions = await this.questionsRepository.find({
        where: { sectionId: section.id },
        order: { displayOrder: 'ASC' },
      });
      (section as any).questions = questions;
    }

    (audit as any).sections = sections;
    return audit;
  }

  async update(id: string, auditData: Partial<Audit>): Promise<Audit> {
    await this.auditsRepository.update(id, auditData);
    const updated = await this.findOne(id);
    await this.logAuditAction(
      updated,
      'Update',
      auditData.updatedBy || auditData.createdBy || updated.updatedBy || updated.createdBy,
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id).catch(() => null);
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('submissions')
        .where('workflow_type = :workflowType AND workflow_id = :workflowId AND status IN (:...statuses)', {
          workflowType: 'audit',
          workflowId: id,
          statuses: ['draft', 'correction', 'pending_review'],
        })
        .execute();
      await manager.getRepository(Audit).delete(id);
    });
    if (existing) {
      await this.logAuditAction(existing, 'Delete', existing.updatedBy || existing.createdBy);
    }
  }

  async publish(id: string): Promise<Audit> {
    await this.auditsRepository.update(id, { status: 'published' });
    const published = await this.findOne(id);
    await this.logAuditAction(published, 'Publish', published.updatedBy || published.createdBy);
    return published;
  }

  async archive(id: string): Promise<Audit> {
    await this.auditsRepository.update(id, { status: 'archived' });
    const archived = await this.findOne(id);
    await this.logAuditAction(archived, 'Archive', archived.updatedBy || archived.createdBy);
    return archived;
  }

  // Section methods
  async createSection(sectionData: Partial<AuditSection>): Promise<AuditSection> {
    const section = this.sectionsRepository.create(sectionData);
    return await this.sectionsRepository.save(section);
  }

  async updateSection(id: string, sectionData: Partial<AuditSection>): Promise<AuditSection> {
    await this.sectionsRepository.update(id, sectionData);
    return await this.sectionsRepository.findOne({ where: { id } });
  }

  async removeSection(id: string): Promise<void> {
    await this.sectionsRepository.delete(id);
  }

  // Question methods
  async createQuestion(questionData: Partial<AuditQuestion>): Promise<AuditQuestion> {
    const question = this.questionsRepository.create(questionData);
    return await this.questionsRepository.save(question);
  }

  async updateQuestion(id: string, questionData: Partial<AuditQuestion>): Promise<AuditQuestion> {
    await this.questionsRepository.update(id, questionData);
    return await this.questionsRepository.findOne({ where: { id } });
  }

  async removeQuestion(id: string): Promise<void> {
    await this.questionsRepository.delete(id);
  }
}
