import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Submission } from './submission.entity';
import { ProcessesService } from '../processes/processes.service';
import { AuditsService } from '../audits/audits.service';
import { AuditLogClient } from '../shared/audit-log.client';
import { notifyReviewRequested, notifyReviewResolved } from '../shared/notification-client';
import { emailSubmissionReport } from '../shared/report.client';
import {
  getReviewConfigFromAudit,
  getReviewConfigFromProcess,
  getReviewerForLevel,
  ReviewConfig,
} from './review-config.util';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission, 'org')
    private submissionsRepository: Repository<Submission>,
    private readonly processesService: ProcessesService,
    private readonly auditsService: AuditsService,
    private readonly auditLogsService: AuditLogClient,
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
      const result = await this.update(submission.id, {
        status: 'pending_review',
        submittedAt,
        currentReviewLevel: 1,
        currentReviewerId: reviewer,
        answers: answersPayload,
      });
      await this.notifyReviewRequested(submission, reviewer, 1);
      await this.maybeSendSubmissionReport(result, 'on-submission');
      return result;
    }

    const result = await this.update(submission.id, {
      status: 'completed',
      submittedAt,
      currentReviewLevel: 0,
      currentReviewerId: null,
      answers: answersPayload,
    });
    await this.maybeSendSubmissionReport(result, 'on-submission');
    return result;
  }

  private async maybeSendSubmissionReport(
    submission: Submission,
    timing: 'on-submission' | 'after-review',
  ) {
    try {
      const workflow = await this.loadWorkflowForSubmission(submission);
      const props = (workflow?.properties ?? {}) as Record<string, unknown>;
      const reportTiming = props.reportTiming;
      if (!reportTiming || reportTiming !== timing) return;

      const reportRecipients = (props.reportRecipients ?? {}) as Record<string, unknown>;
      const config = {
        submitter: Boolean(reportRecipients.submitter),
        storeManager: Boolean(reportRecipients.storeManager),
        custom: Boolean(reportRecipients.custom),
        hierarchical: Boolean(reportRecipients.hierarchical),
        storeHierarchical: Boolean(reportRecipients.storeHierarchical),
        customUserIds: Array.isArray(reportRecipients.customUserIds)
          ? (reportRecipients.customUserIds as string[])
          : [],
        customDesignationIds: Array.isArray(reportRecipients.customDesignationIds)
          ? (reportRecipients.customDesignationIds as string[])
          : [],
      };

      const anyEnabled =
        config.submitter ||
        config.storeManager ||
        (config.custom &&
          (config.customUserIds.length > 0 ||
            config.customDesignationIds.length > 0 ||
            config.hierarchical ||
            config.storeHierarchical));
      if (!anyEnabled) return;

      await emailSubmissionReport({
        submission,
        process: workflow,
        config,
        workflowType: submission.workflowType,
      });
    } catch (error) {
      console.error('Failed to send submission report:', error);
    }
  }

  private async loadWorkflowForSubmission(submission: Submission): Promise<any> {
    if (submission.workflowType === 'audit') {
      return this.auditsService.findOneWithSections(submission.workflowId);
    }
    return this.processesService.findOne(submission.workflowId);
  }

  private async notifyReviewRequested(
    submission: Submission,
    reviewerId: string,
    level: number,
  ) {
    try {
      const title =
        submission.workflowType === 'audit'
          ? (await this.auditsService.findOne(submission.workflowId))?.title
          : (await this.processesService.findOne(submission.workflowId))?.title;
      await notifyReviewRequested({
        userId: reviewerId,
        itemTitle: title ?? submission.workflowId,
        itemType: submission.workflowType === 'audit' ? 'audit' : 'process',
        submissionId: submission.id,
        level,
        submittedBy: submission.submittedBy,
      });
    } catch (error) {
      console.error('Failed to notify reviewer:', error);
    }
  }

  private async notifySubmitter(
    submission: Submission,
    outcome: 'approved' | 'rejected' | 'correction' | 'completed',
    level?: number,
  ) {
    try {
      const title =
        submission.workflowType === 'audit'
          ? (await this.auditsService.findOne(submission.workflowId))?.title
          : (await this.processesService.findOne(submission.workflowId))?.title;
      await notifyReviewResolved({
        userId: submission.submittedBy,
        itemTitle: title ?? submission.workflowId,
        itemType: submission.workflowType === 'audit' ? 'audit' : 'process',
        submissionId: submission.id,
        outcome,
        level,
      });
    } catch (error) {
      console.error('Failed to notify submitter:', error);
    }
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
      const result = await this.update(id, {
        status: 'completed',
        currentReviewerId: null,
        reviewHistory,
      });
      await this.notifySubmitter(submission, 'completed', level);
      await this.maybeSendSubmissionReport(submission, 'after-review');
      return result;
    }

    const nextLevel = level + 1;
    const nextReviewer = getReviewerForLevel(config, nextLevel);
    if (!nextReviewer) {
      throw new Error(`Level ${nextLevel} reviewer is not assigned`);
    }

    const result = await this.update(id, {
      status: 'pending_review',
      currentReviewLevel: nextLevel,
      currentReviewerId: nextReviewer,
      reviewHistory,
    });
    await this.notifyReviewRequested(submission, nextReviewer, nextLevel);
    await this.notifySubmitter(submission, 'approved', level);
    return result;
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

    const result = await this.update(id, {
      status: 'correction',
      currentReviewLevel: 0,
      currentReviewerId: null,
      reviewHistory,
      answers: {
        ...(submission.answers ?? {}),
        correctionNotes,
      },
    });
    await this.notifySubmitter(submission, 'correction', submission.currentReviewLevel);
    return result;
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

    const result = await this.update(id, {
      status: 'rejected',
      currentReviewerId: null,
      reviewHistory,
    });
    await this.notifySubmitter(submission, 'rejected', submission.currentReviewLevel);
    return result;
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
    return this.submissionsRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'process' })
      .andWhere('process.id IS NOT NULL')
      .orderBy('submission.updatedAt', 'DESC')
      .getMany();
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
    return this.submissionsRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'audit' })
      .andWhere('audit.id IS NOT NULL')
      .orderBy('submission.updatedAt', 'DESC')
      .getMany();
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

  async getProcessReport(
    processId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    options: {
      storeId?: string;
      submittedBy?: string;
      status?: string;
      search?: string;
      includeAllStatuses?: boolean;
    } = {},
  ): Promise<any> {
    const includeAll = options.includeAllStatuses !== false;

    const query = this.submissionsRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'process' });

    if (processId && processId !== 'all') {
      query.andWhere('submission.workflowId = :processId', { processId });
    }

    if (!includeAll && options.status && options.status !== 'all') {
      query.andWhere('submission.status = :status', { status: options.status });
    } else if (!includeAll) {
      this.applyReportableFilter(query);
    } else if (options.status && options.status !== 'all') {
      query.andWhere('submission.status = :status', { status: options.status });
    }

    if (options.storeId && options.storeId !== 'all') {
      query.andWhere('submission.storeId = :storeId', { storeId: options.storeId });
    }
    if (options.submittedBy && options.submittedBy !== 'all') {
      query.andWhere('submission.submittedBy = :submittedBy', { submittedBy: options.submittedBy });
    }
    if (startDate) {
      query.andWhere('(submission.submittedAt >= :startDate OR (submission.submittedAt IS NULL AND submission.createdAt >= :startDate))', {
        startDate,
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('(submission.submittedAt <= :endDate OR (submission.submittedAt IS NULL AND submission.createdAt <= :endDate))', {
        endDate: end,
      });
    }
    if (options.search) {
      query.andWhere(
        '(submission.id ILIKE :search OR submission.storeId ILIKE :search OR submission.submittedBy ILIKE :search OR process.title ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    const submissions = await query.orderBy('submission.createdAt', 'DESC').getMany();

    // Load process(es) for expected counts
    let processes: any[] = [];
    if (processId && processId !== 'all') {
      try {
        const process = await this.processesService.findOne(processId);
        if (process) processes = [process];
      } catch {
        processes = [];
      }
    } else {
      try {
        processes = await this.processesService.findAll(organizationId);
        processes = (processes || []).filter((p: any) => p.isActive !== false);
      } catch {
        processes = [];
      }
    }

    const selectedProcess = processes.length === 1 ? processes[0] : null;
    let expected = 0;
    processes.forEach((process: any) => {
      const storeCount = process.storeIds?.length || 0;
      const assigneeCount = process.assigneeIds?.length || 0;
      expected += storeCount * Math.max(assigneeCount, 1);
    });

    // If store filter, expected is assignees for that store only
    if (options.storeId && options.storeId !== 'all') {
      expected = 0;
      processes.forEach((process: any) => {
        if (process.storeIds?.includes(options.storeId)) {
          expected += Math.max(process.assigneeIds?.length || 0, 1);
        }
      });
    }

    const totalSubmitted = submissions.length;
    const completed = submissions.filter((s) => s.status === 'completed').length;
    const pending = submissions.filter((s) =>
      ['new', 'pending_review', 'correction', 'draft'].includes(s.status),
    ).length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    const complianceRate = totalSubmitted > 0 ? Math.round((completed / totalSubmitted) * 100) : 0;
    const completionRate =
      expected > 0 ? Math.min(100, Math.round((totalSubmitted / expected) * 100)) : complianceRate;

    // Store-level aggregation
    const storeMap: Record<string, any> = {};
    submissions.forEach((s) => {
      if (!storeMap[s.storeId]) {
        storeMap[s.storeId] = {
          storeId: s.storeId,
          submitted: 0,
          completed: 0,
          pending: 0,
          rejected: 0,
          expected: 0,
        };
      }
      storeMap[s.storeId].submitted++;
      if (s.status === 'completed') storeMap[s.storeId].completed++;
      else if (s.status === 'rejected') storeMap[s.storeId].rejected++;
      else storeMap[s.storeId].pending++;
    });

    // Seed expected stores from process assignments
    processes.forEach((process: any) => {
      (process.storeIds || []).forEach((sid: string) => {
        if (options.storeId && options.storeId !== 'all' && sid !== options.storeId) return;
        if (!storeMap[sid]) {
          storeMap[sid] = {
            storeId: sid,
            submitted: 0,
            completed: 0,
            pending: 0,
            rejected: 0,
            expected: 0,
          };
        }
        storeMap[sid].expected += Math.max(process.assigneeIds?.length || 0, 1);
      });
    });

    const byStore = Object.values(storeMap)
      .map((row: any) => ({
        ...row,
        complianceRate: row.submitted > 0 ? Math.round((row.completed / row.submitted) * 100) : 0,
        completionRate:
          row.expected > 0
            ? Math.min(100, Math.round((row.submitted / row.expected) * 100))
            : row.submitted > 0
              ? Math.round((row.completed / row.submitted) * 100)
              : 0,
      }))
      .sort((a: any, b: any) => a.storeId.localeCompare(b.storeId));

    // Team-level aggregation (by submitter)
    const teamMap: Record<string, any> = {};
    submissions.forEach((s) => {
      const userId = s.submittedBy || 'Unknown';
      if (!teamMap[userId]) {
        teamMap[userId] = {
          userId,
          submitted: 0,
          completed: 0,
          pending: 0,
          rejected: 0,
        };
      }
      teamMap[userId].submitted++;
      if (s.status === 'completed') teamMap[userId].completed++;
      else if (s.status === 'rejected') teamMap[userId].rejected++;
      else teamMap[userId].pending++;
    });

    // Seed assignees from process
    processes.forEach((process: any) => {
      (process.assigneeIds || []).forEach((uid: string) => {
        if (options.submittedBy && options.submittedBy !== 'all' && uid !== options.submittedBy) return;
        if (!teamMap[uid]) {
          teamMap[uid] = { userId: uid, submitted: 0, completed: 0, pending: 0, rejected: 0 };
        }
      });
    });

    const byTeam = Object.values(teamMap)
      .map((row: any) => ({
        ...row,
        complianceRate: row.submitted > 0 ? Math.round((row.completed / row.submitted) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.submitted - a.submitted);

    // Org-level: per-process breakdown when viewing all processes
    const processMap: Record<string, any> = {};
    submissions.forEach((s) => {
      const pid = s.workflowId;
      const title = s.process?.title || pid;
      if (!processMap[pid]) {
        processMap[pid] = {
          processId: pid,
          processTitle: title,
          processTag: s.process?.processTag || 'Uncategorized',
          submitted: 0,
          completed: 0,
          pending: 0,
          expected: 0,
        };
      }
      processMap[pid].submitted++;
      if (s.status === 'completed') processMap[pid].completed++;
      else processMap[pid].pending++;
    });
    processes.forEach((process: any) => {
      if (!processMap[process.id]) {
        processMap[process.id] = {
          processId: process.id,
          processTitle: process.title,
          processTag: process.processTag || 'Uncategorized',
          submitted: 0,
          completed: 0,
          pending: 0,
          expected: 0,
        };
      }
      processMap[process.id].expected =
        (process.storeIds?.length || 0) * Math.max(process.assigneeIds?.length || 0, 1);
      processMap[process.id].processTitle = process.title;
      processMap[process.id].processTag = process.processTag || 'Uncategorized';
    });

    const byProcess = Object.values(processMap)
      .map((row: any) => ({
        ...row,
        complianceRate: row.submitted > 0 ? Math.round((row.completed / row.submitted) * 100) : 0,
        completionRate:
          row.expected > 0 ? Math.min(100, Math.round((row.submitted / row.expected) * 100)) : 0,
      }))
      .sort((a: any, b: any) => a.processTitle.localeCompare(b.processTitle));

    return {
      processId: selectedProcess?.id || processId || 'all',
      processTitle: selectedProcess?.title || (processId === 'all' || !processId ? 'All Processes' : processId),
      processTag: selectedProcess?.processTag || null,
      kpis: {
        totalSubmitted,
        completed,
        pending,
        rejected,
        expected,
        completionRate,
        complianceRate,
        storeCount: byStore.length,
        teamCount: byTeam.length,
        processCount: byProcess.length,
      },
      submissions,
      byStore,
      byTeam,
      byProcess,
      filters: {
        storeId: options.storeId || 'all',
        submittedBy: options.submittedBy || 'all',
        status: options.status || 'all',
      },
    };
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
