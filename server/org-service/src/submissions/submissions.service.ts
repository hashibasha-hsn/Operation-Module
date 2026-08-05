import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Submission } from './submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { ProcessesService } from '../processes/processes.service';
import { AuditsService } from '../audits/audits.service';
import { EntitiesService } from '../entities/entities.service';
import { AuditLogClient } from '../shared/audit-log.client';
import { notifyReviewRequested, notifyReviewResolved } from '../shared/notification-client';
import { emailSubmissionReport, resolveUserName } from '../shared/report.client';
import {
  getReviewConfigFromAudit,
  getReviewConfigFromProcess,
  getReviewerForLevel,
  ReviewConfig,
} from './review-config.util';

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission, 'org')
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(Process, 'org')
    private processesRepository: Repository<Process>,
    @InjectRepository(Audit, 'org')
    private auditsRepository: Repository<Audit>,
    private readonly processesService: ProcessesService,
    private readonly auditsService: AuditsService,
    private readonly entitiesService: EntitiesService,
    private readonly auditLogsService: AuditLogClient,
  ) {}

  /**
   * The submissions table stores the workflow reference in workflowId/workflowType,
   * while the process/audit relation join columns (processId/auditId) are never
   * populated. Attach lightweight { title } / { title, processTag } objects so the
   * UI can render workflow names without relying on the broken relations.
   */
  private async withWorkflowTitles(submissions: Submission[]): Promise<any[]> {
    if (!submissions.length) return [];

    const processIds = [...new Set(
      submissions.filter((s) => s.workflowType !== 'audit').map((s) => s.workflowId),
    )];
    const auditIds = [...new Set(
      submissions.filter((s) => s.workflowType === 'audit').map((s) => s.workflowId),
    )];

    const [processes, audits] = await Promise.all([
      processIds.length
        ? this.processesRepository
            .createQueryBuilder('p')
            .where('CAST(p.id AS text) IN (:...processIds)', { processIds })
            .select(['p.id', 'p.title', 'p.processTag'])
            .getMany()
        : Promise.resolve([]),
      auditIds.length
        ? this.auditsRepository
            .createQueryBuilder('a')
            .where('CAST(a.id AS text) IN (:...auditIds)', { auditIds })
            .select(['a.id', 'a.title'])
            .getMany()
        : Promise.resolve([]),
    ]);

    const processMap = new Map(processes.map((p) => [String(p.id), p]));
    const auditMap = new Map(audits.map((a) => [String(a.id), a]));

    return submissions.map((s) => {
      if (s.workflowType === 'audit') {
        const audit = auditMap.get(String(s.workflowId));
        return { ...s, process: null, audit: audit ? { title: audit.title } : null };
      }
      const process = processMap.get(String(s.workflowId));
      return {
        ...s,
        process: process ? { title: process.title, processTag: process.processTag } : null,
        audit: null,
      };
    });
  }

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

  async findPendingApprovals(userId: string, organizationId: string): Promise<any[]> {
    const submissions = await this.submissionsRepository.find({
      where: {
        organizationId,
        status: 'pending_review',
        currentReviewerId: userId,
      },
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });
    return this.withWorkflowTitles(submissions);
  }

  async getStatusCounts(
    organizationId: string,
    userId: string,
  ): Promise<{
    total: number;
    pending: number;
    correction: number;
    completed: number;
  }> {
    const rows = await this.submissionsRepository
      .createQueryBuilder('submission')
      .select('submission.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere(
        `(
          submission.currentReviewerId = :userId
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(submission.review_history::jsonb, '[]'::jsonb)) historyEntry
            WHERE historyEntry->>'reviewerId' = :userId
          )
        )`,
        { userId },
      )
      .groupBy('submission.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus: Record<string, number> = {};
    rows.forEach((row) => {
      byStatus[row.status] = Number(row.count);
    });

    return {
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      pending: byStatus['pending_review'] ?? 0,
      correction: byStatus['correction'] ?? 0,
      completed: byStatus['completed'] ?? 0,
    };
  }

  /**
   * All submissions that came to this user for review (currently assigned as the
   * reviewer, or acted on by the user at some point). Used by the Workflow Status tab.
   */
  async getReviewQueue(userId: string, organizationId: string): Promise<any[]> {
    const submissions = await this.submissionsRepository
      .createQueryBuilder('submission')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere(
        `(
          submission.currentReviewerId = :userId
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(submission.review_history::jsonb, '[]'::jsonb)) historyEntry
            WHERE historyEntry->>'reviewerId' = :userId
          )
        )`,
        { userId },
      )
      .orderBy('submission.createdAt', 'DESC')
      .getMany();

    return this.withWorkflowTitles(submissions);
  }

  private getReviewConfigForSubmission(submission: Submission): Promise<ReviewConfig> {
    if (submission.workflowType === 'audit') {
      return this.auditsService.findOne(submission.workflowId).then(getReviewConfigFromAudit);
    }
    return this.processesService.findOne(submission.workflowId).then(getReviewConfigFromProcess);
  }

  private getSubmissionWindow(props: Record<string, unknown>): { startTime?: string; endTime?: string } {
    const fc = (props.frequencyConfig ?? {}) as Record<string, unknown>;
    const start = String(props.startTime ?? fc.startTime ?? '').trim();
    const end = String(props.endTime ?? fc.endTime ?? '').trim();
    return { startTime: start || undefined, endTime: end || undefined };
  }

  private getSubmissionDate(submission: Submission): Date {
    const raw = (submission.answers as any)?.submissionDate;
    const dateStr = String(raw || submission.submittedAt?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10)).slice(0, 10);
    return new Date(`${dateStr}T00:00:00`);
  }

  private periodKey(periodicityType: string, date: Date): string {
    const y = date.getFullYear();
    switch (periodicityType) {
      case 'weekly': {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
        return `W-${start.toISOString().slice(0, 10)}`;
      }
      case 'monthly':
        return `M-${y}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'yearly':
        return `Y-${y}`;
      default:
        return `D-${date.toISOString().slice(0, 10)}`;
    }
  }

  private async assertCanSubmit(
    props: Record<string, unknown> | undefined | null,
    submission: Submission,
  ): Promise<void> {
    if (!props) return;

    const now = new Date();
    const subDate = this.getSubmissionDate(submission);
    const window = this.getSubmissionWindow(props);

    const occurrence = props.occurrence === 'one-time' ? 'one-time' : 'recurring';
    const responsesAfterEndTime = props.responsesAfterEndTime === 'reject' ? 'reject' : 'accept';
    const numberOfResponses = props.numberOfResponses === 'multiple-per-user' ? 'multiple-per-user' : 'one-per-user';
    const submissionBy = props.submissionBy === 'everyone' ? 'everyone' : 'anyone';
    const dateRangeSelection = props.dateRangeSelection === 'restricted' ? 'restricted' : 'allowed';
    const periodicityType = String(props.periodicityType || 'daily');

    // Responses-after-end-time / restricted date range
    if (window.endTime) {
      const [hh, mm] = window.endTime.split(':').map(Number);
      if (!Number.isNaN(hh)) {
        const endBound = new Date(subDate);
        endBound.setHours(hh || 0, mm || 0, 0, 0);
        const pastEnd = now.getTime() > endBound.getTime();
        if (pastEnd && (responsesAfterEndTime === 'reject' || dateRangeSelection === 'restricted')) {
          throw new BadRequestException(
            `Responses are closed after the end time (${window.endTime}) for this submission date.`,
          );
        }
      }
    }

    if (dateRangeSelection === 'restricted' && window.startTime) {
      const [hh, mm] = window.startTime.split(':').map(Number);
      if (!Number.isNaN(hh)) {
        const startBound = new Date(subDate);
        startBound.setHours(hh || 0, mm || 0, 0, 0);
        if (now.getTime() < startBound.getTime()) {
          throw new BadRequestException(
            `Responses are not open yet. This form opens at ${window.startTime} for the selected date.`,
          );
        }
      }
    }

    const active = await this.submissionsRepository.find({
      where: {
        workflowType: submission.workflowType as any,
        workflowId: submission.workflowId,
        storeId: submission.storeId,
        status: In(['completed', 'pending_review', 'correction']),
      },
    });
    const others = active.filter((s) => s.id !== submission.id);

    // Occurrence: one-time (single submission) or recurring (one per period per user)
    const isRecurring = occurrence === 'recurring';
    let samePeriodByUser: Submission[] = [];
    if (isRecurring) {
      const currentPeriod = this.periodKey(periodicityType, subDate);
      samePeriodByUser = others.filter(
        (s) =>
          s.submittedBy === submission.submittedBy &&
          this.periodKey(periodicityType, this.getSubmissionDate(s)) === currentPeriod,
      );
      if (samePeriodByUser.length > 0) {
        const label =
          periodicityType === 'yearly' ? 'year' : periodicityType === 'monthly' ? 'month' : periodicityType === 'weekly' ? 'week' : 'day';
        throw new BadRequestException(
          `You have already submitted this form. Only one submission is allowed per ${label}.`,
        );
      }
    } else if (others.length > 0) {
      throw new BadRequestException(
        'This form allows only a single submission and one already exists.',
      );
    }

    // Number of responses: one-per-user gate (scoped to the active period for recurring forms)
    if (numberOfResponses === 'one-per-user') {
      const scoped = isRecurring
        ? samePeriodByUser
        : others.filter((s) => s.submittedBy === submission.submittedBy);
      if (scoped.length > 0) {
        throw new BadRequestException('You already have a response for this form. Only one response per user is allowed.');
      }
    }

    // Submission by: everyone must submit (a user cannot duplicate their own submission in the same scope)
    if (submissionBy === 'everyone') {
      const byUser = isRecurring
        ? samePeriodByUser
        : others.filter((s) => s.submittedBy === submission.submittedBy);
      if (byUser.length > 0) {
        throw new BadRequestException('Every user is expected to submit this form once; duplicate submissions are not allowed.');
      }
    }

    // Geo-fence: restrict submissions to the store radius (location-optional, so a missing GPS tag is allowed)
    if (Boolean(props.geoFence)) {
      const geoTag = (submission.answers as any)?.geoTag as Record<string, unknown> | undefined;
      const hasTag = Boolean(
        geoTag &&
          geoTag.available === true &&
          geoTag.latitude != null &&
          geoTag.longitude != null,
      );
      if (hasTag && submission.storeId) {
        const store = await this.entitiesService.findOne(submission.storeId);
        const storeLat = Number((store as any)?.latitude);
        const storeLng = Number((store as any)?.longitude);
        if (
          store &&
          !Number.isNaN(storeLat) &&
          !Number.isNaN(storeLng) &&
          (storeLat !== 0 || storeLng !== 0)
        ) {
          const dist = haversineMeters(
            Number(geoTag.latitude),
            Number(geoTag.longitude),
            storeLat,
            storeLng,
          );
          const radius = Math.max(1, Number(props.geoFenceRadiusMeters ?? 500));
          if (dist > radius) {
            throw new BadRequestException(
              `You are ${Math.round(dist)} m from the store — outside the ${radius} m geo-fence.`,
            );
          }
        }
      }
    }
  }

  private assertReviewer(submission: Submission, config: ReviewConfig, reviewerId: string) {
    const expected = getReviewerForLevel(config, submission.currentReviewLevel);
    if (!expected || expected !== reviewerId) {
      throw new BadRequestException('You are not the assigned reviewer for this level');
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
    reviewerId?: string,
    reviewerName?: string | null,
    notes?: string,
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
        workflowId: submission.workflowId,
        outcome,
        level,
        reviewerId,
        reviewerName,
        notes,
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

    const reviewerName = await resolveUserName(reviewerId);
    const reviewHistory = [...(submission.reviewHistory || [])];
    const level = submission.currentReviewLevel;
    reviewHistory.push({
      level,
      action: 'approved',
      reviewerId,
      reviewerName,
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
      // No assignee for the next level (legacy or edited config): complete the review.
      const result = await this.update(id, {
        status: 'completed',
        currentReviewLevel: level,
        currentReviewerId: null,
        reviewHistory,
      });
      await this.notifySubmitter(submission, 'completed', level);
      await this.maybeSendSubmissionReport(submission, 'after-review');
      return result;
    }

    const result = await this.update(id, {
      status: 'pending_review',
      currentReviewLevel: nextLevel,
      currentReviewerId: nextReviewer,
      reviewHistory,
    });
    await this.notifyReviewRequested(submission, nextReviewer, nextLevel);
    await this.notifySubmitter(submission, 'approved', level, reviewerId, reviewerName);
    return result;
  }

  async sendForCorrection(id: string, reviewerId: string, correctionNotes: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission || submission.status !== 'pending_review') {
      throw new BadRequestException('Submission is not pending review');
    }

    const config = await this.getReviewConfigForSubmission(submission);
    this.assertReviewer(submission, config, reviewerId);

    const reviewerName = await resolveUserName(reviewerId);
    const reviewedAt = new Date();

    const reviewHistory = [...(submission.reviewHistory || [])];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'correction',
      reviewerId,
      reviewerName,
      notes: correctionNotes,
      timestamp: reviewedAt,
    });

    const result = await this.update(id, {
      status: 'correction',
      currentReviewLevel: 0,
      currentReviewerId: null,
      reviewHistory,
      answers: {
        ...(submission.answers ?? {}),
        correctionNotes,
        correction: {
          notes: correctionNotes,
          reviewerId,
          reviewerName,
          reviewedAt: reviewedAt.toISOString(),
        },
      },
    });
    await this.notifySubmitter(
      submission,
      'correction',
      submission.currentReviewLevel,
      reviewerId,
      reviewerName,
      correctionNotes,
    );
    return result;
  }

  async reject(id: string, reviewerId: string, rejectionReason: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission || submission.status !== 'pending_review') {
      throw new BadRequestException('Submission is not pending review');
    }

    const config = await this.getReviewConfigForSubmission(submission);
    this.assertReviewer(submission, config, reviewerId);

    const reviewerName = await resolveUserName(reviewerId);
    const reviewHistory = [...(submission.reviewHistory || [])];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'rejected',
      reviewerId,
      reviewerName,
      reason: rejectionReason,
      timestamp: new Date(),
    });

    const result = await this.update(id, {
      status: 'rejected',
      currentReviewerId: null,
      reviewHistory,
    });
    await this.notifySubmitter(
      submission,
      'rejected',
      submission.currentReviewLevel,
      reviewerId,
      reviewerName,
      rejectionReason,
    );
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
    await this.assertCanSubmit(process?.properties, submission);
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
      .leftJoinAndSelect(
        'submission.process',
        'process',
        'CAST(process.id AS text) = submission.workflowId',
      )
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'process' })
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
    await this.assertCanSubmit(audit?.properties, submission);
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
      .leftJoinAndSelect(
        'submission.audit',
        'audit',
        'CAST(audit.id AS text) = submission.workflowId',
      )
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId })
      .andWhere('submission.workflowType = :workflowType', { workflowType: 'audit' })
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

    return this.withWorkflowTitles(
      await query.orderBy('submission.createdAt', 'DESC').getMany(),
    );
  }

  async getWorkflowDetail(
    workflowId: string,
    workflowType: string,
    organizationId: string,
  ): Promise<any> {
    let workflow: any = null;
    if (workflowType === 'audit') {
      workflow = await this.auditsService.findOneWithSections(workflowId);
    } else {
      try {
        workflow = await this.processesService.findOne(workflowId);
      } catch {
        workflow = null;
      }
    }

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const submissions = await this.submissionsRepository
      .createQueryBuilder('submission')
      .where('submission.workflowId = :workflowId', { workflowId })
      .andWhere('submission.organizationId = :organizationId', { organizationId })
      .orderBy('submission.createdAt', 'DESC')
      .getMany();

    return {
      workflow,
      submissions,
    };
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

    return this.withWorkflowTitles(
      await query.orderBy('submission.createdAt', 'DESC').getMany(),
    );
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

    const submissions = await this.withWorkflowTitles(
      await query.orderBy('submission.createdAt', 'DESC').getMany(),
    );

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

    const hiddenProcessIds = new Set(
      (processes || [])
        .filter((p: any) => p.properties?.hideScoresCompliance === true)
        .map((p: any) => p.id),
    );

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
    const visibleSubmissions = submissions.filter((s) => !hiddenProcessIds.has(s.workflowId));
    const complianceRate =
      visibleSubmissions.length > 0
        ? Math.round(
            (visibleSubmissions.filter((s) => s.status === 'completed').length /
              visibleSubmissions.length) *
              100,
          )
        : 0;
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
      .map((row: any) => {
        const hidden = hiddenProcessIds.has(row.processId);
        return {
          ...row,
          complianceHidden: hidden,
          complianceRate: hidden
            ? null
            : row.submitted > 0
              ? Math.round((row.completed / row.submitted) * 100)
              : 0,
          completionRate:
            row.expected > 0 ? Math.min(100, Math.round((row.submitted / row.expected) * 100)) : 0,
        };
      })
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
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('process.sections', 'sections')
      .leftJoinAndSelect('sections.questions', 'questions')
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

    // Track Visual Merchandising: collect photo answers for processes with the flag on,
    // grouped by question tag.
    const trackedProcessIds = new Set<string>();
    const photoEntries: any[] = [];
    submissions.forEach((submission: any) => {
      const process = submission.process;
      if (!process || process.properties?.trackVisualMerchandising !== true) return;
      trackedProcessIds.add(process.id);
      const responses = submission.answers?.responses ?? {};
      (process.sections ?? []).forEach((section: any) => {
        (section.questions ?? []).forEach((question: any) => {
          const type = question.questionType || 'text';
          if (type !== 'photo' && type !== 'file' && type !== 'file-upload') return;
          const value = responses?.[question.id];
          if (!value || typeof value !== 'string' || !value.trim()) return;
          photoEntries.push({
            submissionId: submission.id,
            storeId: submission.storeId,
            processId: process.id,
            processName: process.title,
            questionId: question.id,
            questionText: question.questionText,
            questionTag: question.options?.questionTag || 'Uncategorized',
            photoUrl: value.trim(),
            submittedAt: submission.submittedAt || submission.createdAt,
          });
        });
      });
    });

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
      visualTrackingEnabled: trackedProcessIds.size > 0,
      trackedProcessIds: Array.from(trackedProcessIds),
      photoEntries,
    };
  }

  async getExpiredSubmissions(organizationId: string): Promise<any[]> {
    const now = new Date();
    const submissions = await this.submissionsRepository.find({
      where: {
        organizationId,
        dueDate: LessThan(now) as any,
        status: In(['new', 'correction']) as any,
      },
      order: { dueDate: 'ASC' },
    });
    return this.withWorkflowTitles(submissions);
  }
}
