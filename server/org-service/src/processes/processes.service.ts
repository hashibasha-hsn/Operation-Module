import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Process } from './process.entity';
import { ProcessSection } from './process-section.entity';
import { ProcessQuestion } from './process-question.entity';
import { SaveProcessDraftDto } from './save-process-draft.dto';
import { AuditLogClient } from '../shared/audit-log.client';
import { notifyProcessAssigned } from '../shared/notification-client';

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
        if (!existing.createdBy && dto.createdBy) {
          processPayload.createdBy = dto.createdBy;
        }
        await processRepo.update(dto.id, processPayload);
        await sectionRepo.delete({ processId: dto.id });
        process = await processRepo.findOne({ where: { id: dto.id } });
      } else {
        processPayload.createdBy = dto.createdBy ?? null;
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
    }
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
    await this.processesRepository.update(id, processData);
    const updated = await this.findOne(id);
    await this.logProcessAction(updated, 'Update', processData.updatedBy || processData.createdBy);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id).catch(() => null);
    await this.processesRepository.delete(id);
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
    for (const uid of added) {
      notifyProcessAssigned({ userId: uid, processId: id, processTitle: updated.title, assignedBy: updated.updatedBy || updated.createdBy });
    }
    await this.logProcessAction(updated, 'Update', updated.updatedBy || updated.createdBy);
    return updated;
  }

  async publish(id: string): Promise<Process> {
    const process = await this.findOne(id);
    if (!process.title?.trim()) {
      throw new Error('Process title is required before publish');
    }
    await this.processesRepository.update(id, { status: 'published', isActive: true });
    const published = await this.findOne(id);
    await this.logProcessAction(published, 'Publish', published.updatedBy || published.createdBy);
    return published;
  }

  async archive(id: string): Promise<Process> {
    return await this.update(id, { status: 'archived' });
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
