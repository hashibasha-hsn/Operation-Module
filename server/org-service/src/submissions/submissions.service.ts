import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Submission } from './submission.entity';
import { ProcessesService } from '../processes/processes.service';
import { AuditsService } from '../audits/audits.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  getReviewConfigFromAudit,
  getReviewConfigFromProcess,
  getReviewerForLevel,
  ReviewConfig,
} from './review-config.util';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    private readonly processesService: ProcessesService,
    private readonly auditsService: AuditsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async logFormAction(
    submission: Submission,
    userId: string,
    operation: string,
    title?: string,
  ) {
    try {
      const performedBy = await this.auditLogsService.resolveEmail(userId);
      await this.auditLogsService.log({
        target: 'Form Submission',
        operation,
        performedBy,
        details: {
          title: title ?? 'Untitled Form',
          FormId: submission.workflowId,
          submissionId: submission.id,
          workflowType: submission.workflowType,
          status: submission.status,
        },
        targetId: submission.id,
        organizationId: submission.organizationId,
      });
    } catch (error) {
      console.error('Failed to write form audit log:', error);
    }
  }

  async create(submissionData: Partial<Submission>): Promise<Submission> {
    const submission = this.submissionsRepository.create(submissionData);
    return await this.submissionsRepository.save(submission);
  }

  async findAll(organizationId: string): Promise<Submission[]> {
    return await this.submissionsRepository.find({
      where: { organizationId },
      relations: ['process'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingApprovals(userId: string, organizationId: string): Promise<Submission[]> {
    return await this.submissionsRepository.find({
      where: {
        organizationId,
        status: 'pending_review',
        currentReviewerId: userId,
      },
      relations: ['process', 'audit'],
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async getReviewConfigForSubmission(submission: Submission): Promise<ReviewConfig> {
    if (submission.workflowType === 'audit') {
      const audit = await this.auditsService.findOne(submission.workflowId);
      return getReviewConfigFromAudit(audit);
    }
    const process = await this.processesService.findOne(submission.workflowId);
    return getReviewConfigFromProcess(process);
  }

  private assertReviewer(submission: Submission, config: ReviewConfig, reviewerId: string) {
    const expected = getReviewerForLevel(config, submission.currentReviewLevel);
    if (!expected || expected !== reviewerId) {
      throw new Error('You are not the assigned reviewer for this level');
    }
  }

  private buildAnswersPayload(submission: Submission, answers: Record<string, unknown>) {
    return {
      ...(submission.answers ?? {}),
      ...answers,
      responses: (answers as any).responses ?? submission.answers?.responses ?? {},
    };
  }

  private async finalizeSubmit(
    submission: Submission,
    answers: Record<string, unknown>,
    reviewConfig: ReviewConfig,
  ) {
    const answersPayload = this.buildAnswersPayload(submission, answers);
    const submittedAt = new Date();

    if (reviewConfig.enabled) {
      const reviewer = getReviewerForLevel(reviewConfig, 1);
      if (!reviewer) {
        throw new Error('Review is enabled but Level 1 reviewer is not assigned');
      }
      return this.update(submission.id, {
        status: 'pending_review',
        submittedAt,
        currentReviewLevel: 1,
        currentReviewerId: reviewer,
        answers: answersPayload,
      });
    }

    return this.update(submission.id, {
      status: 'completed',
      submittedAt,
      currentReviewLevel: 0,
      currentReviewerId: null,
      answers: answersPayload,
    });
  }

  async findOne(id: string): Promise<Submission> {
    return await this.submissionsRepository.findOne({
      where: { id },
    });
  }

  async findOneWithRelations(id: string): Promise<Submission> {
    return await this.submissionsRepository.findOne({
      where: { id },
      relations: ['process'],
    });
  }

  async update(id: string, submissionData: Partial<Submission>): Promise<Submission> {
    await this.submissionsRepository.update(id, submissionData);
    return await this.findOneWithRelations(id);
  }

  async approve(id: string, reviewerId: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission || submission.status !== 'pending_review') {
      throw new Error('Submission is not pending review');
    }

    const config = await this.getReviewConfigForSubmission(submission);
    this.assertReviewer(submission, config, reviewerId);

    const reviewHistory = [...(submission.reviewHistory || [])];
    const level = submission.currentReviewLevel;
    reviewHistory.push({
      level,
      action: 'approved',
      reviewerId,
      timestamp: new Date(),
    });

    if (level >= config.levels) {
      return await this.update(id, {
        status: 'completed',
        currentReviewerId: null,
        reviewHistory,
      });
    }

    const nextLevel = level + 1;
    const nextReviewer = getReviewerForLevel(config, nextLevel);
    if (!nextReviewer) {
      throw new Error(`Level ${nextLevel} reviewer is not assigned`);
    }

    return await this.update(id, {
      status: 'pending_review',
      currentReviewLevel: nextLevel,
      currentReviewerId: nextReviewer,
      reviewHistory,
    });
  }

  async sendForCorrection(id: string, reviewerId: string, correctionNotes: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission || submission.status !== 'pending_review') {
      throw new Error('Submission is not pending review');
    }

    const config = await this.getReviewConfigForSubmission(submission);
    this.assertReviewer(submission, config, reviewerId);

    const reviewHistory = [...(submission.reviewHistory || [])];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'correction',
      reviewerId,
      notes: correctionNotes,
      timestamp: new Date(),
    });

    return await this.update(id, {
      status: 'correction',
      currentReviewLevel: 0,
      currentReviewerId: null,
      reviewHistory,
      answers: {
        ...(submission.answers ?? {}),
        correctionNotes,
      },
    });
  }

  async reject(id: string, reviewerId: string, rejectionReason: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission || submission.status !== 'pending_review') {
      throw new Error('Submission is not pending review');
    }

    const config = await this.getReviewConfigForSubmission(submission);
    this.assertReviewer(submission, config, reviewerId);

    const reviewHistory = [...(submission.reviewHistory || [])];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'rejected',
      reviewerId,
      reason: rejectionReason,
      timestamp: new Date(),
    });

    return await this.update(id, {
      status: 'rejected',
      currentReviewerId: null,
      reviewHistory,
    });
  }

  async remove(id: string): Promise<void> {
    await this.submissionsRepository.delete(id);
  }

  async findProcessDraft(
    processId: string,
    userId: string,
    storeId: string,
    organizationId: string,
  ): Promise<Submission | null> {
    return this.submissionsRepository.findOne({
      where: {
        workflowType: 'process',
        workflowId: processId,
        submittedBy: userId,
        storeId,
        organizationId,
        status: 'draft',
      },
      relations: ['process'],
    });
  }

  async startProcessSubmission(payload: {
    processId: string;
    userId: string;
    storeId: string;
    organizationId: string;
    submissionDate?: string;
  }): Promise<Submission> {
    const existing = await this.findProcessDraft(
      payload.processId,
      payload.userId,
      payload.storeId,
      payload.organizationId,
    );
    if (existing) return existing;

    return this.create({
      workflowType: 'process',
      workflowId: payload.processId,
      storeId: payload.storeId,
      submittedBy: payload.userId,
      organizationId: payload.organizationId,
      status: 'draft',
      answers: {
        submissionDate: payload.submissionDate ?? new Date().toISOString().slice(0, 10),
        responses: {},
      },
    });
  }

  async saveProcessDraft(id: string, userId: string, answers: Record<string, unknown>) {
    const submission = await this.findOne(id);
    if (
      !submission ||
      submission.submittedBy !== userId ||
      !['draft', 'correction'].includes(submission.status)
    ) {
      throw new Error('Draft submission not found');
    }
    return this.update(id, {
      answers: {
        ...(submission.answers ?? {}),
        ...answers,
        responses: answers.responses ?? submission.answers?.responses ?? {},
      },
    });
  }

  async submitProcess(id: string, userId: string, answers: Record<string, unknown>) {
    const submission = await this.findOne(id);
    if (
      !submission ||
      submission.submittedBy !== userId ||
      !['draft', 'correction'].includes(submission.status) ||
      submission.workflowType !== 'process'
    ) {
      throw new Error('Submission not found or not submittable');
    }

    const process = await this.processesService.findOne(submission.workflowId);
    const reviewConfig = getReviewConfigFromProcess(process);
    const result = await this.finalizeSubmit(submission, answers, reviewConfig);
    await this.logFormAction(submission, userId, 'Update', process?.title);
    return result;
  }

  async discardProcessDraft(id: string, userId: string): Promise<void> {
    const submission = await this.findOne(id);
    if (!submission || submission.submittedBy !== userId || submission.status !== 'draft') {
      throw new Error('Draft submission not found');
    }
    const process = await this.processesService.findOne(submission.workflowId);
    await this.logFormAction(submission, userId, 'Discard', process?.title);
    await this.remove(id);
  }

  async findUserProcessSubmissions(userId: string, organizationId: string) {
    return this.submissionsRepository.find({
      where: {
        organizationId,
        submittedBy: userId,
        workflowType: 'process',
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async findAuditDraft(
    auditId: string,
    userId: string,
    storeId: string,
    organizationId: string,
  ): Promise<Submission | null> {
    return this.submissionsRepository.findOne({
      where: {
        workflowType: 'audit',
        workflowId: auditId,
        submittedBy: userId,
        storeId,
        organizationId,
        status: 'draft',
      },
    });
  }

  async startAuditSubmission(payload: {
    auditId: string;
    userId: string;
    storeId: string;
    organizationId: string;
    submissionDate?: string;
  }): Promise<Submission> {
    const existing = await this.findAuditDraft(
      payload.auditId,
      payload.userId,
      payload.storeId,
      payload.organizationId,
    );
    if (existing) return existing;

    return this.create({
      workflowType: 'audit',
      workflowId: payload.auditId,
      storeId: payload.storeId,
      submittedBy: payload.userId,
      organizationId: payload.organizationId,
      status: 'draft',
      answers: {
        submissionDate: payload.submissionDate ?? new Date().toISOString().slice(0, 10),
        responses: {},
      },
    });
  }

  async saveAuditSubmissionDraft(id: string, userId: string, answers: Record<string, unknown>) {
    const submission = await this.findOne(id);
    if (
      !submission ||
      submission.submittedBy !== userId ||
      !['draft', 'correction'].includes(submission.status) ||
      submission.workflowType !== 'audit'
    ) {
      throw new Error('Draft submission not found');
    }
    return this.update(id, {
      answers: {
        ...(submission.answers ?? {}),
        ...answers,
        responses: answers.responses ?? submission.answers?.responses ?? {},
      },
    });
  }

  async submitAudit(id: string, userId: string, answers: Record<string, unknown>) {
    const submission = await this.findOne(id);
    if (
      !submission ||
      submission.submittedBy !== userId ||
      !['draft', 'correction'].includes(submission.status) ||
      submission.workflowType !== 'audit'
    ) {
      throw new Error('Submission not found or not submittable');
    }

    const audit = await this.auditsService.findOne(submission.workflowId);
    const reviewConfig = getReviewConfigFromAudit(audit);
    const result = await this.finalizeSubmit(submission, answers, reviewConfig);
    await this.logFormAction(submission, userId, 'Update', audit?.title);
    return result;
  }

  async discardAuditDraft(id: string, userId: string): Promise<void> {
    const submission = await this.findOne(id);
    if (
      !submission ||
      submission.submittedBy !== userId ||
      submission.status !== 'draft' ||
      submission.workflowType !== 'audit'
    ) {
      throw new Error('Draft submission not found');
    }
    const audit = await this.auditsService.findOne(submission.workflowId);
    await this.logFormAction(submission, userId, 'Discard', audit?.title);
    await this.remove(id);
  }

  async findUserAuditSubmissions(userId: string, organizationId: string) {
    return this.submissionsRepository.find({
      where: {
        organizationId,
        submittedBy: userId,
        workflowType: 'audit',
      },
      order: { updatedAt: 'DESC' },
    });
  }

  // Report methods — only fully approved submissions appear in analytics reports
  private applyReportableFilter(query: any) {
    query.andWhere('submission.status = :completedStatus', { completedStatus: 'completed' });
    return query;
  }

  async getMyReport(userId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<Submission[]> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId });

    this.applyReportableFilter(query);

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    return await query.orderBy('submission.createdAt', 'DESC').getMany();
  }

  async getStoreReport(storeId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<Submission[]> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.storeId = :storeId', { storeId });

    this.applyReportableFilter(query);

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    return await query.orderBy('submission.createdAt', 'DESC').getMany();
  }

  async getProcessReport(processId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<Submission[]> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.workflowId = :processId', { processId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'process' });

    this.applyReportableFilter(query);

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    return await query.orderBy('submission.createdAt', 'DESC').getMany();
  }

  async getOrganizationReport(organizationId: string, startDate?: Date, endDate?: Date): Promise<Submission[]> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    this.applyReportableFilter(query);

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    return await query.orderBy('submission.createdAt', 'DESC').getMany();
  }

  async getVisualReport(organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .where('submission.organizationId = :organizationId', { organizationId });

    this.applyReportableFilter(query);

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    const submissions = await query.getMany();

    // Calculate analytics
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.length;
    const pendingSubmissions = 0;
    const correctionSubmissions = 0;
    const rejectedSubmissions = 0;

    // Group by workflow type
    const processSubmissions = submissions.filter(s => s.workflowType === 'process').length;
    const auditSubmissions = submissions.filter(s => s.workflowType === 'audit').length;

    // Group by store
    const byStore = submissions.reduce((acc, submission) => {
      acc[submission.storeId] = (acc[submission.storeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by date
    const byDate = submissions.reduce((acc, submission) => {
      const date = submission.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSubmissions,
      completedSubmissions,
      pendingSubmissions,
      correctionSubmissions,
      rejectedSubmissions,
      processSubmissions,
      auditSubmissions,
      byStore,
      byDate,
    };
  }

  async getExpiredSubmissions(organizationId: string): Promise<Submission[]> {
    const now = new Date();
    return await this.submissionsRepository.find({
      where: {
        organizationId,
        dueDate: LessThan(now) as any,
        status: In(['new', 'correction']) as any,
      },
      relations: ['process'],
      order: { dueDate: 'ASC' },
    });
  }
}
