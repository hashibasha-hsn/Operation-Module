import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Process } from './process.entity';
import { ProcessSection } from './process-section.entity';
import { ProcessQuestion } from './process-question.entity';
import { SaveProcessDraftDto } from './save-process-draft.dto';
import { AuditLogClient } from '../shared/audit-log.client';
import { notifyProcessAssigned } from '../shared/notification-client';
import { emailProcessAssigned } from '../shared/email.client';

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(Process, 'org')
    private processesRepository: Repository<Process>,
    @InjectRepository(ProcessSection, 'org')
    private sectionsRepository: Repository<ProcessSection>,
    @InjectRepository(ProcessQuestion, 'org')
    private questionsRepository: Repository<ProcessQuestion>,
    @InjectDataSource('org')
    private readonly dataSource: DataSource,
    private readonly auditLogClient: AuditLogClient,
  ) {}

  private async recordStatus(process: Process, status: string, actor?: string | null) {
    const history = process.statusHistory || [];
    const last = history[history.length - 1];
    if (last && last.status === status) return history;
    const entry = {
      status,
      actor: actor || process.updatedBy || process.createdBy || null,
      timestamp: new Date(),
    };
    history.push(entry);
    return history.slice(-200);
  }

  private async logProcessAction(
    process: Partial<Process> | null | undefined,
    operation: string,
    actor?: string | null,
  ) {
    try {
      const performedBy = await this.auditLogClient.resolveEmail(
        actor || process?.createdBy || process?.updatedBy || 'system',
      );
      await this.auditLogClient.log({
        target: 'Process',
        operation,
        performedBy,
        details: {
          title: process?.title || 'Untitled Process',
          workflowType: 'process',
          status: process?.status,
        },
        targetId: process?.id,
        organizationId: process?.organizationId || 'default-org',
      });
    } catch (error) {
      console.error('Failed to write process audit log:', error);
    }
  }

  async create(processData: Partial<Process>): Promise<Process> {
    const process = this.processesRepository.create({
      status: 'draft',
      statusHistory: [{ status: 'draft', actor: processData.createdBy || null, timestamp: new Date() }],
      ...processData,
    });
    const saved = await this.processesRepository.save(process);
    await this.logProcessAction(saved, 'Create', processData.createdBy);
    return saved;
  }

  async saveDraft(dto: SaveProcessDraftDto): Promise<Process> {
    if (!dto.title?.trim()) {
      throw new Error('Process title is required');
    }

    let previousAssigneeIds: string[] = [];

    return this.dataSource.transaction(async (manager) => {
      const processRepo = manager.getRepository(Process);
      const sectionRepo = manager.getRepository(ProcessSection);
      const questionRepo = manager.getRepository(ProcessQuestion);

      const processPayload: Partial<Process> = {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        processTags: dto.processTags ?? [],
        processTag: dto.processTags?.[0] ?? null,
        organizationId: dto.organizationId,
        status: 'draft',
        properties: dto.properties ?? null,
        frequency: dto.frequency ?? null,
        frequencyConfig: dto.frequencyConfig ?? null,
        reminderConfig: dto.reminderConfig ?? null,
        requiresApproval: dto.requiresApproval ?? false,
        assigneeIds: dto.assigneeIds ?? [],
        storeIds: dto.storeIds ?? [],
      };

      let process: Process;
      if (dto.id) {
        const existing = await processRepo.findOne({ where: { id: dto.id } });
        if (!existing) {
          throw new NotFoundException(`Process ${dto.id} not found`);
        }
        previousAssigneeIds = existing.assigneeIds ?? [];
        if (!existing.createdBy && dto.createdBy) {
          processPayload.createdBy = dto.createdBy;
        }
        processPayload.statusHistory = await this.recordStatus(
          existing as Process,
          'draft',
          dto.createdBy,
        );
        await processRepo.update(dto.id, processPayload);
        await sectionRepo.delete({ processId: dto.id });
        process = await processRepo.findOne({ where: { id: dto.id } });
      } else {
        processPayload.createdBy = dto.createdBy ?? null;
        processPayload.statusHistory = [
          { status: 'draft', actor: dto.createdBy ?? null, timestamp: new Date() },
        ];
        process = await processRepo.save(processRepo.create(processPayload));
      }

      for (const [sectionIndex, sectionDto] of (dto.sections ?? []).entries()) {
        const section = await sectionRepo.save(
          sectionRepo.create({
            title: sectionDto.title?.trim() || `Section ${sectionIndex + 1}`,
            description: sectionDto.description?.trim() ?? '',
            displayOrder: sectionDto.displayOrder ?? sectionIndex,
            processId: process.id,
          }),
        );

        for (const [questionIndex, questionDto] of (sectionDto.questions ?? []).entries()) {
          await questionRepo.save(
            questionRepo.create({
              questionText: questionDto.questionText?.trim() || 'Untitled question',
              questionType: questionDto.questionType,
              options: questionDto.options ?? null,
              isRequired: questionDto.isRequired ?? false,
              validationRules: questionDto.validationRules ?? null,
              displayOrder: questionDto.displayOrder ?? questionIndex,
              sectionId: section.id,
            }),
          );
        }
      }

      return manager.getRepository(Process).findOne({
        where: { id: process.id },
        relations: ['sections', 'sections.questions'],
      });
    }).then(async (saved) => {
      const savedAssigneeIds = saved.assigneeIds ?? [];
      const added = savedAssigneeIds.filter((uid) => !previousAssigneeIds.includes(uid));
      const emailAlerts = Boolean(saved.reminderConfig?.emailAlerts);
      for (const uid of added) {
        notifyProcessAssigned({
          userId: uid,
          processId: saved.id,
          processTitle: saved.title,
          assignedBy: dto.createdBy || saved.createdBy,
        });
        if (emailAlerts) {
          await emailProcessAssigned({
            userId: uid,
            processId: saved.id,
            processTitle: saved.title,
            assignedBy: dto.createdBy || saved.createdBy,
          });
        }
      }
      await this.logProcessAction(
        saved,
        dto.id ? 'Update' : 'Create',
        dto.createdBy || saved?.createdBy,
      );
      return saved;
    });
  }

  async findAll(organizationId: string): Promise<Process[]> {
    return await this.processesRepository.find({
      where: { organizationId },
      relations: ['sections', 'sections.questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublished(organizationId: string): Promise<Process[]> {
    return await this.processesRepository.find({
      where: { organizationId, status: 'published', isActive: true },
      relations: ['sections', 'sections.questions'],
      order: { title: 'ASC' },
    });
  }

  async findAssignedToUser(
    userId: string,
    storeId: string | undefined,
    organizationId: string,
  ): Promise<Process[]> {
    const published = await this.findPublished(organizationId);
    return published.filter(
      (process) =>
        process.assigneeIds?.includes(userId) ||
        (storeId && process.storeIds?.includes(storeId)),
    );
  }

  async assignUserToProcesses(userId: string, processIds: string[]): Promise<void> {
    for (const processId of processIds) {
      const process = await this.findOne(processId);
      const assigneeIds = [...new Set([...(process.assigneeIds ?? []), userId])];
      await this.processesRepository.update(processId, { assigneeIds });
      notifyProcessAssigned({ userId, processId, processTitle: process.title, assignedBy: process.updatedBy || process.createdBy });
      if (Boolean(process.reminderConfig?.emailAlerts)) {
        await emailProcessAssigned({ userId, processId, processTitle: process.title, assignedBy: process.updatedBy || process.createdBy });
      }
    }
  }

  async autoAssignUserToProcesses(body: {
    userId: string;
    designation?: string;
    storeId?: string;
    organizationId?: string;
  }): Promise<{ matched: number; processIds: string[] }> {
    const orgId = body.organizationId ?? 'default-org';
    const published = await this.processesRepository.find({
      where: { organizationId: orgId, status: 'published', isActive: true },
    });

    const matches: Process[] = [];
    for (const process of published) {
      const props = process.properties ?? {};
      if (props.dynamicAssignment !== true) continue;

      const storeIds = process.storeIds ?? [];
      const storeMatch = storeIds.length === 0 || (body.storeId ? storeIds.includes(body.storeId) : false);
      if (!storeMatch) continue;

      const designations: string[] = (props.assignedDesignations ?? []).filter(Boolean);
      const designationMatch =
        designations.length === 0 ||
        (body.designation
          ? designations.some((d) => String(d).trim().toLowerCase() === body.designation!.trim().toLowerCase())
          : false);
      if (!designationMatch) continue;

      matches.push(process);
    }

    for (const process of matches) {
      const assigneeIds = [...new Set([...(process.assigneeIds ?? []), body.userId])];
      await this.processesRepository.update(process.id, { assigneeIds });
      notifyProcessAssigned({
        userId: body.userId,
        processId: process.id,
        processTitle: process.title,
        assignedBy: body.userId,
      });
    }

    return { matched: matches.length, processIds: matches.map((p) => p.id) };
  }

  async findOne(id: string): Promise<Process> {
    const process = await this.processesRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.questions'],
    });
    if (!process) {
      throw new NotFoundException(`Process ${id} not found`);
    }
    return process;
  }

  async update(id: string, processData: Partial<Process>): Promise<Process> {
    const existing = await this.findOne(id).catch(() => null);
    if (existing && processData.status && processData.status !== existing.status) {
      processData.statusHistory = await this.recordStatus(
        existing,
        processData.status,
        processData.updatedBy || processData.createdBy,
      );
    }
    await this.processesRepository.update(id, processData);
    const updated = await this.findOne(id);
    await this.logProcessAction(updated, 'Update', processData.updatedBy || processData.createdBy);
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
          workflowType: 'process',
          workflowId: id,
          statuses: ['draft', 'correction', 'pending_review'],
        })
        .execute();
      await manager.getRepository(Process).delete(id);
    });
    if (existing) {
      await this.logProcessAction(existing, 'Delete', existing.updatedBy || existing.createdBy);
    }
  }

  async saveAssignment(
    id: string,
    assignment: { assigneeIds?: string[]; storeIds?: string[] },
  ): Promise<Process> {
    const process = await this.findOne(id);
    const oldAssigneeIds = process.assigneeIds ?? [];
    await this.processesRepository.update(id, {
      assigneeIds: assignment.assigneeIds ?? process.assigneeIds ?? [],
      storeIds: assignment.storeIds ?? process.storeIds ?? [],
    });
    const updated = await this.findOne(id);
    const newAssigneeIds = updated.assigneeIds ?? [];
    const added = newAssigneeIds.filter((uid) => !oldAssigneeIds.includes(uid));
    const emailAlerts = Boolean(updated.reminderConfig?.emailAlerts);
    for (const uid of added) {
      notifyProcessAssigned({ userId: uid, processId: id, processTitle: updated.title, assignedBy: updated.updatedBy || updated.createdBy });
      if (emailAlerts) {
        await emailProcessAssigned({ userId: uid, processId: id, processTitle: updated.title, assignedBy: updated.updatedBy || updated.createdBy });
      }
    }
    await this.logProcessAction(updated, 'Update', updated.updatedBy || updated.createdBy);
    return updated;
  }

  async publish(id: string): Promise<Process> {
    const process = await this.findOne(id);
    if (!process.title?.trim()) {
      throw new Error('Process title is required before publish');
    }
    await this.processesRepository.update(id, {
      status: 'published',
      isActive: true,
      statusHistory: await this.recordStatus(
        process,
        'published',
        process.updatedBy || process.createdBy,
      ),
    });
    const published = await this.findOne(id);
    await this.logProcessAction(published, 'Publish', published.updatedBy || published.createdBy);
    return published;
  }

  async archive(id: string): Promise<Process> {
    const existing = await this.findOne(id);
    await this.processesRepository.update(id, {
      status: 'archived',
      statusHistory: await this.recordStatus(
        existing,
        'archived',
        existing.updatedBy || existing.createdBy,
      ),
    });
    return await this.findOne(id);
  }

  async createChild(id: string, actor?: string): Promise<Process> {
    const parent = await this.findOne(id);
    const child = await this.saveDraft({
      id: undefined as any,
      title: `${parent.title} (Child)`,
      description: parent.description ?? '',
      processTags: parent.processTags ?? [],
      organizationId: parent.organizationId,
      properties: parent.properties ?? null,
      frequency: parent.frequency ?? null,
      frequencyConfig: parent.frequencyConfig ?? null,
      reminderConfig: parent.reminderConfig ?? null,
      requiresApproval: parent.requiresApproval ?? false,
      assigneeIds: parent.assigneeIds ?? [],
      storeIds: parent.storeIds ?? [],
      createdBy: actor || parent.createdBy,
      sections: (parent.sections ?? []).map((section) => ({
        title: section.title,
        description: section.description,
        displayOrder: section.displayOrder,
        questions: (section.questions ?? []).map((question) => ({
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          isRequired: question.isRequired,
          validationRules: question.validationRules,
          displayOrder: question.displayOrder,
        })),
      })),
    } as any);
    await this.processesRepository.update(child.id, { parentId: parent.id });
    return await this.findOne(child.id);
  }

  async createSection(sectionData: Partial<ProcessSection>): Promise<ProcessSection> {
    const section = this.sectionsRepository.create(sectionData);
    return await this.sectionsRepository.save(section);
  }

  async updateSection(id: string, sectionData: Partial<ProcessSection>): Promise<ProcessSection> {
    await this.sectionsRepository.update(id, sectionData);
    return await this.sectionsRepository.findOne({ where: { id } });
  }

  async removeSection(id: string): Promise<void> {
    await this.sectionsRepository.delete(id);
  }

  async createQuestion(questionData: Partial<ProcessQuestion>): Promise<ProcessQuestion> {
    const question = this.questionsRepository.create(questionData);
    return await this.questionsRepository.save(question);
  }

  async updateQuestion(id: string, questionData: Partial<ProcessQuestion>): Promise<ProcessQuestion> {
    await this.questionsRepository.update(id, questionData);
    return await this.questionsRepository.findOne({ where: { id } });
  }

  async removeQuestion(id: string): Promise<void> {
    await this.questionsRepository.delete(id);
  }
}
