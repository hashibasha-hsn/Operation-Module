import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './audit.entity';
import { AuditSection } from './audit-section.entity';
import { AuditQuestion } from './audit-question.entity';

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit)
    private auditsRepository: Repository<Audit>,
    @InjectRepository(AuditSection)
    private sectionsRepository: Repository<AuditSection>,
    @InjectRepository(AuditQuestion)
    private questionsRepository: Repository<AuditQuestion>,
  ) {}

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
    return await this.auditsRepository.save(audit);
  }

  async updateAuditBasicInfo(id: string, data: {
    title?: string;
    description?: string;
    processTag?: string;
  }): Promise<Audit> {
    await this.auditsRepository.update(id, data);
    return await this.findOne(id);
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
    occurrence?: 'one-time' | 'recurring';
    responsesAfterEndTime?: 'accept' | 'reject';
    numberOfResponses?: 'one' | 'multiple';
    submissionBy?: 'anyone' | 'everyone';
    dateRangeSelection?: 'allowed' | 'restricted';
  }): Promise<Audit> {
    await this.auditsRepository.update(id, data);
    return await this.findOne(id);
  }

  async updateAuditAssignment(id: string, data: {
    assigneeIds?: string[];
    storeIds?: string[];
  }): Promise<Audit> {
    await this.auditsRepository.update(id, data);
    return await this.findOne(id);
  }

  async create(auditData: Partial<Audit>): Promise<Audit> {
    const audit = this.auditsRepository.create(auditData);
    return await this.auditsRepository.save(audit);
  }

  async findAll(organizationId: string): Promise<Audit[]> {
    return await this.auditsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Audit> {
    return await this.auditsRepository.findOne({
      where: { id },
    });
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
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.auditsRepository.delete(id);
  }

  async publish(id: string): Promise<Audit> {
    return await this.update(id, { status: 'published' });
  }

  async archive(id: string): Promise<Audit> {
    return await this.update(id, { status: 'archived' });
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
