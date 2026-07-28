import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';
import { SaveAssessmentDraftDto } from './save-assessment-draft.dto';
import {
  applyPassingScore,
  scoreAssessmentAnswers,
} from './assessment-scoring.util';
import { notifyCertificateIssued, notifyAssessmentAssignment } from '../shared/notification-client';
import {
  getNotifiedAssigneeIds,
  mergeNotifiedAssigneeIds,
  resolveAssessmentAssigneeUserIds,
} from '../shared/assessment-assignment.util';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment, 'org')
    private assessmentsRepository: Repository<Assessment>,
    @InjectRepository(AssessmentResult, 'org')
    private assessmentResultsRepository: Repository<AssessmentResult>,
  ) {}

  // Assessment methods
  async saveDraft(dto: SaveAssessmentDraftDto): Promise<Assessment> {
    if (!dto.title?.trim()) {
      throw new Error('Assessment title is required');
    }

    const payload: Partial<Assessment> = {
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      organizationId: dto.organizationId,
      status: 'draft',
      questions: dto.sections ?? [],
      passingScore: dto.passingScore ?? 0,
      duration: dto.duration ?? 0,
      maxAttempts: dto.maxAttempts ?? 1,
      allowRetake: dto.allowRetake ?? false,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      visible: dto.visible ?? true,
      showResult: dto.showResult ?? false,
      showCorrectAnswer: dto.showCorrectAnswer ?? false,
      dynamicAssignment: dto.dynamicAssignment ?? false,
      generateCertificate: dto.generateCertificate ?? false,
      properties: dto.properties ?? null,
      certificateSettings: dto.certificateSettings ?? null,
      assigneeIds: dto.assigneeIds ?? [],
      storeIds: dto.storeIds ?? [],
      assigneeProfiles: dto.assigneeProfiles ?? null,
    };

    if (dto.id) {
      const existing = await this.findOne(dto.id);
      if (!existing) {
        throw new NotFoundException(`Assessment ${dto.id} not found`);
      }
      await this.assessmentsRepository.update(dto.id, payload);
      return this.findOne(dto.id);
    }

    const assessment = this.assessmentsRepository.create(payload);
    return this.assessmentsRepository.save(assessment);
  }

  async assignAssessment(
    id: string,
    assignment: { assigneeIds?: string[]; storeIds?: string[]; assigneeProfiles?: Record<string, unknown> },
  ): Promise<Assessment> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    await this.assessmentsRepository.update(id, {
      assigneeIds: assignment.assigneeIds ?? existing.assigneeIds ?? [],
      storeIds: assignment.storeIds ?? existing.storeIds ?? [],
      assigneeProfiles: assignment.assigneeProfiles ?? existing.assigneeProfiles ?? null,
    });

    const updated = await this.findOne(id);
    await this.notifyNewAssessmentAssignees(updated);
    return updated;
  }

  private async notifyNewAssessmentAssignees(assessment: Assessment): Promise<string[]> {
    const resolved = await resolveAssessmentAssigneeUserIds(assessment);
    const alreadyNotified = getNotifiedAssigneeIds(assessment);
    const sent: string[] = [];

    for (const userId of resolved) {
      if (alreadyNotified.has(userId)) continue;

      await notifyAssessmentAssignment({
        userId,
        assessmentTitle: assessment.title,
        assessmentId: assessment.id,
        dueAt: assessment.expiresAt ?? null,
      });
      sent.push(userId);
    }

    if (sent.length) {
      await this.assessmentsRepository.update(assessment.id, {
        properties: mergeNotifiedAssigneeIds(assessment, sent),
      });
    }

    return sent;
  }

  async publish(id: string): Promise<Assessment> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    if (!existing.title?.trim()) {
      throw new BadRequestException('Assessment title is required before publishing');
    }

    const sections = Array.isArray(existing.questions) ? existing.questions : [];
    const questionCount = sections.reduce(
      (count: number, section: any) => count + (Array.isArray(section?.questions) ? section.questions.length : 0),
      0,
    );
    if (questionCount === 0) {
      throw new BadRequestException('Add at least one question before publishing');
    }

    const profiles = (existing.assigneeProfiles ?? {}) as {
      profileIds?: string[];
      designationNames?: string[];
    };
    const hasAssignment =
      (existing.assigneeIds?.length ?? 0) > 0 ||
      (existing.storeIds?.length ?? 0) > 0 ||
      (profiles.profileIds?.length ?? 0) > 0 ||
      (profiles.designationNames?.length ?? 0) > 0;
    if (!hasAssignment) {
      throw new BadRequestException('Assign stores, designations, or profiles before publishing');
    }

    const wasPublished = existing.status === 'published';

    await this.assessmentsRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
      isActive: true,
    });

    const updated = await this.findOne(id);
    if (!wasPublished) {
      await this.notifyNewAssessmentAssignees(updated);
    }
    return updated;
  }

  async findAssignedToUser(
    userId: string,
    storeId: string | undefined,
    organizationId: string,
  ): Promise<Assessment[]> {
    const published = await this.assessmentsRepository.find({
      where: { organizationId, status: 'published', isActive: true, visible: true },
      order: { title: 'ASC' },
    });

    const matches: Assessment[] = [];
    const now = new Date();
    for (const assessment of published) {
      if (assessment.startDate && new Date(assessment.startDate) > now) {
        continue;
      }
      if (assessment.expiresAt && new Date(assessment.expiresAt) < now) {
        continue;
      }

      const profiles = (assessment.assigneeProfiles ?? {}) as {
        profileIds?: string[];
        designationNames?: string[];
        assignBy?: string;
      };
      const hasAssignment =
        (assessment.assigneeIds?.length ?? 0) > 0 ||
        (assessment.storeIds?.length ?? 0) > 0 ||
        (profiles.profileIds?.length ?? 0) > 0 ||
        (profiles.designationNames?.length ?? 0) > 0;

      if (!hasAssignment) {
        continue;
      }

      if (storeId && (assessment.storeIds ?? []).includes(storeId)) {
        matches.push(assessment);
        continue;
      }

      const resolvedUserIds = await resolveAssessmentAssigneeUserIds(assessment);
      if (resolvedUserIds.includes(userId)) {
        matches.push(assessment);
      }
    }

    return matches;
  }

  async create(assessmentData: Partial<Assessment>): Promise<Assessment> {
    const assessment = this.assessmentsRepository.create(assessmentData);
    return await this.assessmentsRepository.save(assessment);
  }

  async findAll(organizationId: string, status?: string): Promise<Assessment[]> {
    const where: Record<string, unknown> = { organizationId };
    if (status) {
      where.status = status;
    }
    return await this.assessmentsRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Assessment> {
    return await this.assessmentsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, assessmentData: Partial<Assessment>): Promise<Assessment> {
    await this.assessmentsRepository.update(id, assessmentData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<Assessment> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }
    await this.assessmentsRepository.update(id, {
      status: 'archived',
      isActive: false,
    });
    return this.findOne(id);
  }

  // Assessment Result methods
  async createResult(resultData: Partial<AssessmentResult>): Promise<AssessmentResult> {
    const result = this.assessmentResultsRepository.create(resultData);
    return await this.assessmentResultsRepository.save(result);
  }

  async findUserResults(userId: string, organizationId: string): Promise<AssessmentResult[]> {
    return await this.assessmentResultsRepository.find({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findResultById(id: string): Promise<AssessmentResult> {
    const result = await this.assessmentResultsRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException(`Assessment result ${id} not found`);
    }
    return result;
  }

  async startAttempt(payload: {
    assessmentId: string;
    userId: string;
    userEmail?: string;
    storeId?: string;
    organizationId?: string;
  }): Promise<AssessmentResult> {
    const organizationId = payload.organizationId || 'default-org';
    const assessment = await this.findOne(payload.assessmentId);
    if (!assessment || assessment.status !== 'published' || !assessment.isActive) {
      throw new BadRequestException('Assessment is not available');
    }

    if (assessment.expiresAt && new Date(assessment.expiresAt) < new Date()) {
      throw new BadRequestException('Assessment has expired');
    }

    if (assessment.startDate && new Date(assessment.startDate) > new Date()) {
      throw new BadRequestException('Assessment has not started yet');
    }

    const existingInProgress = await this.assessmentResultsRepository.findOne({
      where: {
        assessmentId: payload.assessmentId,
        userId: payload.userId,
        organizationId,
        status: 'in_progress',
      },
    });
    if (existingInProgress) {
      return existingInProgress;
    }

    const completedAttempts = await this.assessmentResultsRepository.count({
      where: {
        assessmentId: payload.assessmentId,
        userId: payload.userId,
        organizationId,
        status: 'completed',
      },
    });

    const maxAttempts = assessment.maxAttempts ?? 1;
    if (completedAttempts >= maxAttempts) {
      throw new BadRequestException('Maximum attempts reached for this assessment');
    }

    if (!assessment.allowRetake && completedAttempts > 0) {
      const passedAttempt = await this.assessmentResultsRepository.findOne({
        where: {
          assessmentId: payload.assessmentId,
          userId: payload.userId,
          organizationId,
          status: 'completed',
          passed: true,
        },
      });
      if (passedAttempt) {
        throw new BadRequestException('You have already passed this assessment');
      }
    }

    return this.createResult({
      assessmentId: payload.assessmentId,
      userId: payload.userId,
      userEmail: payload.userEmail,
      storeId: payload.storeId,
      organizationId,
      status: 'in_progress',
      attemptNumber: completedAttempts + 1,
      startedAt: new Date(),
      answers: { responses: {} },
      score: 0,
      percentage: 0,
      passed: false,
    });
  }

  async saveAttempt(
    id: string,
    userId: string,
    responses: Record<string, unknown>,
  ): Promise<AssessmentResult> {
    const result = await this.findResultById(id);
    if (result.userId !== userId) {
      throw new BadRequestException('Not allowed to update this attempt');
    }
    if (result.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress attempts can be saved');
    }

    await this.assessmentResultsRepository.update(id, {
      answers: { ...(result.answers ?? {}), responses },
    });
    return this.findResultById(id);
  }

  async submitAttempt(
    id: string,
    userId: string,
    responses: Record<string, unknown>,
  ): Promise<{ result: AssessmentResult; assessment: Assessment; questionResults: any[] }> {
    const result = await this.findResultById(id);
    if (result.userId !== userId) {
      throw new BadRequestException('Not allowed to submit this attempt');
    }
    if (result.status !== 'in_progress') {
      throw new BadRequestException('This attempt has already been submitted');
    }

    const assessment = await this.findOne(result.assessmentId);
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const scoring = scoreAssessmentAnswers(assessment.questions, responses);
    const passed = applyPassingScore(scoring.percentage, assessment.passingScore ?? 0);
    const completedAt = new Date();
    const timeTaken = result.startedAt
      ? Math.max(0, Math.round((completedAt.getTime() - new Date(result.startedAt).getTime()) / 1000))
      : null;

    await this.assessmentResultsRepository.update(id, {
      answers: {
        responses,
        questionResults: scoring.questionResults,
      } as any,
      score: scoring.score,
      percentage: scoring.percentage,
      passed,
      status: 'completed',
      completedAt,
      endedAt: completedAt,
      timeTaken,
    });

    const updated = await this.findResultById(id);

    if (passed && assessment.generateCertificate) {
      void notifyCertificateIssued({
        userId,
        itemTitle: assessment.title,
        itemType: 'assessment',
        itemId: assessment.id,
        resultId: updated.id,
        score: scoring.score,
        percentage: scoring.percentage,
      });
    }

    return {
      result: updated,
      assessment,
      questionResults: scoring.questionResults,
    };
  }

  async discardAttempt(id: string, userId: string): Promise<void> {
    const result = await this.findResultById(id);
    if (result.userId !== userId) {
      throw new BadRequestException('Not allowed to discard this attempt');
    }
    if (result.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress attempts can be discarded');
    }
    await this.assessmentResultsRepository.delete(id);
  }

  async findResultsByAssessment(assessmentId: string): Promise<AssessmentResult[]> {
    return await this.assessmentResultsRepository.find({
      where: { assessmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateResult(id: string, resultData: Partial<AssessmentResult>): Promise<AssessmentResult> {
    await this.assessmentResultsRepository.update(id, resultData);
    return await this.assessmentResultsRepository.findOne({ where: { id } });
  }

  // Assessment Report methods
  private isCompletedResult(result: AssessmentResult): boolean {
    return result.status === 'completed' || Boolean(result.completedAt);
  }

  private candidateLabel(result: AssessmentResult): string {
    return result.userEmail || result.userId || 'Unknown';
  }

  async getAssessmentReport(
    assessmentId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId })
      .andWhere('result.assessmentId = :assessmentId', { assessmentId });

    if (startDate) {
      query.andWhere('COALESCE(result.completedAt, result.createdAt) >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('COALESCE(result.completedAt, result.createdAt) <= :endDate', {
        endDate: end,
      });
    }

    const results = await query.orderBy('result.createdAt', 'DESC').getMany();
    return results.map((result) => ({
      ...result,
      userName: this.candidateLabel(result),
      percentage: result.percentage ?? 0,
      score: result.score ?? 0,
      isCompleted: this.isCompletedResult(result),
    }));
  }

  async getAssessmentOrgReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const assessments = await this.assessmentsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });

    const resultsQuery = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .where('result.organizationId = :organizationId', { organizationId });

    if (startDate) {
      resultsQuery.andWhere('COALESCE(result.completedAt, result.createdAt) >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      resultsQuery.andWhere('COALESCE(result.completedAt, result.createdAt) <= :endDate', {
        endDate: end,
      });
    }

    const results = await resultsQuery.getMany();
    const resultsByAssessment = new Map<string, AssessmentResult[]>();
    results.forEach((result) => {
      const list = resultsByAssessment.get(result.assessmentId) || [];
      list.push(result);
      resultsByAssessment.set(result.assessmentId, list);
    });

    return assessments.map((assessment) => {
      const all = resultsByAssessment.get(assessment.id) || [];
      const completed = all.filter((r) => this.isCompletedResult(r));
      const passed = completed.filter((r) => r.passed).length;
      const failed = completed.length - passed;
      const avgScore =
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, r) => sum + (r.percentage || 0), 0) / completed.length,
            )
          : 0;
      const passRate =
        completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0;

      return {
        id: assessment.id,
        title: assessment.title,
        noOfSubmissions: completed.length,
        inProgressCount: all.length - completed.length,
        passed,
        failed,
        passRate,
        avgScore,
        status: assessment.isActive ? 'Active' : 'Inactive',
        createdAt: assessment.createdAt,
        description: assessment.description,
        passingScore: assessment.passingScore,
        duration: assessment.duration,
        allowRetake: assessment.allowRetake,
        maxAttempts: assessment.maxAttempts,
      };
    });
  }

  async getAssessmentResultsReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('COALESCE(result.completedAt, result.createdAt) >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('COALESCE(result.completedAt, result.createdAt) <= :endDate', {
        endDate: end,
      });
    }

    const results = await query.orderBy('result.createdAt', 'DESC').getMany();

    return results.map((result) => {
      const completed = this.isCompletedResult(result);
      return {
        id: result.id,
        name: result.assessment?.title ?? 'Assessment',
        assessmentId: result.assessmentId,
        user: this.candidateLabel(result),
        userId: result.userId,
        score: result.percentage ?? result.score,
        percentage: result.percentage ?? 0,
        status: !completed
          ? result.status === 'in_progress'
            ? 'In Progress'
            : 'Pending'
          : result.passed
            ? 'Passed'
            : 'Failed',
        passed: completed ? result.passed : null,
        date: result.completedAt ?? result.createdAt,
        storeId: result.storeId,
        attemptNumber: result.attemptNumber,
        timeTaken: result.timeTaken,
      };
    });
  }

  async getAssessmentSubmissionList(
    assessmentId: string,
    organizationId: string,
  ): Promise<any[]> {
    const query = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.assessmentId = :assessmentId', { assessmentId })
      .andWhere('result.organizationId = :organizationId', { organizationId });

    const results = await query.orderBy('result.createdAt', 'DESC').getMany();

    return results.map((result) => ({
      id: result.id,
      date: result.createdAt,
      startedAt: result.startedAt,
      endedAt: result.endedAt || result.completedAt,
      attemptNumber: result.attemptNumber,
      storeId: result.storeId,
      submittedBy: result.userId,
      submitterName: this.candidateLabel(result),
      email: result.userEmail,
      status: result.status,
      percentage: result.percentage,
      score: result.score,
      passed: result.passed,
      assessmentId: result.assessmentId,
      assessmentTitle: result.assessment?.title,
    }));
  }

  async getSubmissionDetail(submissionId: string): Promise<any> {
    const result = await this.assessmentResultsRepository.findOne({
      where: { id: submissionId },
      relations: ['assessment'],
    });
    if (!result) {
      throw new NotFoundException('Submission not found');
    }
    return {
      ...result,
      userName: this.candidateLabel(result),
      questionResults: result.answers?.questionResults || [],
      responses: result.answers?.responses || result.answers || {},
    };
  }

  async getAssessmentAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    assessmentId?: string,
  ): Promise<any> {
    const query = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId });

    if (assessmentId) {
      query.andWhere('result.assessmentId = :assessmentId', { assessmentId });
    }
    if (startDate) {
      query.andWhere('COALESCE(result.completedAt, result.createdAt) >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('COALESCE(result.completedAt, result.createdAt) <= :endDate', {
        endDate: end,
      });
    }

    const results = await query.orderBy('result.createdAt', 'ASC').getMany();
    const completed = results.filter((r) => this.isCompletedResult(r));
    const inProgress = results.filter((r) => !this.isCompletedResult(r));
    const passed = completed.filter((r) => r.passed);
    const failed = completed.filter((r) => !r.passed);

    const avgScore =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, r) => sum + (r.percentage || 0), 0) / completed.length,
          )
        : 0;
    const passRate =
      completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0;
    const failRate =
      completed.length > 0 ? Math.round((failed.length / completed.length) * 100) : 0;
    const avgTimeTaken =
      completed.filter((r) => typeof r.timeTaken === 'number').length > 0
        ? Math.round(
            completed
              .filter((r) => typeof r.timeTaken === 'number')
              .reduce((sum, r) => sum + (r.timeTaken || 0), 0) /
              completed.filter((r) => typeof r.timeTaken === 'number').length,
          )
        : 0;

    const scoreBuckets = [
      { range: '0-49', count: 0 },
      { range: '50-59', count: 0 },
      { range: '60-69', count: 0 },
      { range: '70-79', count: 0 },
      { range: '80-89', count: 0 },
      { range: '90-100', count: 0 },
    ];
    completed.forEach((r) => {
      const pct = r.percentage || 0;
      if (pct < 50) scoreBuckets[0].count++;
      else if (pct < 60) scoreBuckets[1].count++;
      else if (pct < 70) scoreBuckets[2].count++;
      else if (pct < 80) scoreBuckets[3].count++;
      else if (pct < 90) scoreBuckets[4].count++;
      else scoreBuckets[5].count++;
    });

    const trendMap = new Map<
      string,
      { date: string; attempts: number; passed: number; failed: number; avgScoreSum: number }
    >();
    completed.forEach((r) => {
      const key = new Date(r.completedAt || r.createdAt).toISOString().slice(0, 10);
      if (!trendMap.has(key)) {
        trendMap.set(key, {
          date: key,
          attempts: 0,
          passed: 0,
          failed: 0,
          avgScoreSum: 0,
        });
      }
      const row = trendMap.get(key)!;
      row.attempts += 1;
      if (r.passed) row.passed += 1;
      else row.failed += 1;
      row.avgScoreSum += r.percentage || 0;
    });
    const trends = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        date: row.date,
        attempts: row.attempts,
        passed: row.passed,
        failed: row.failed,
        avgScore: row.attempts > 0 ? Math.round(row.avgScoreSum / row.attempts) : 0,
        passRate: row.attempts > 0 ? Math.round((row.passed / row.attempts) * 100) : 0,
      }));

    const byAssessmentMap = new Map<string, any>();
    completed.forEach((r) => {
      const key = r.assessmentId;
      if (!byAssessmentMap.has(key)) {
        byAssessmentMap.set(key, {
          assessmentId: key,
          title: r.assessment?.title || 'Assessment',
          attempts: 0,
          passed: 0,
          failed: 0,
          scoreSum: 0,
        });
      }
      const row = byAssessmentMap.get(key);
      row.attempts += 1;
      if (r.passed) row.passed += 1;
      else row.failed += 1;
      row.scoreSum += r.percentage || 0;
    });
    const byAssessment = Array.from(byAssessmentMap.values())
      .map((row) => ({
        assessmentId: row.assessmentId,
        title: row.title,
        attempts: row.attempts,
        passed: row.passed,
        failed: row.failed,
        passRate: row.attempts > 0 ? Math.round((row.passed / row.attempts) * 100) : 0,
        avgScore: row.attempts > 0 ? Math.round(row.scoreSum / row.attempts) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);

    const uniqueCandidates = new Set(completed.map((r) => r.userId)).size;

    return {
      kpis: {
        totalAttempts: results.length,
        completedAttempts: completed.length,
        inProgressAttempts: inProgress.length,
        passed: passed.length,
        failed: failed.length,
        passRate,
        failRate,
        avgScore,
        avgTimeTaken,
        uniqueCandidates,
        assessmentsWithResults: byAssessment.length,
      },
      scoreDistribution: scoreBuckets,
      trends,
      byAssessment,
      recentResults: completed
        .slice()
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() -
            new Date(a.completedAt || a.createdAt).getTime(),
        )
        .slice(0, 25)
        .map((r) => ({
          id: r.id,
          assessmentId: r.assessmentId,
          assessmentTitle: r.assessment?.title || 'Assessment',
          userId: r.userId,
          userName: this.candidateLabel(r),
          percentage: r.percentage || 0,
          passed: r.passed,
          attemptNumber: r.attemptNumber,
          completedAt: r.completedAt || r.createdAt,
          storeId: r.storeId,
          timeTaken: r.timeTaken,
        })),
    };
  }

  async getCandidateComparison(
    organizationId: string,
    assessmentId: string,
    mode: 'latest' | 'best' = 'best',
  ): Promise<any> {
    if (!assessmentId) {
      throw new BadRequestException('assessmentId is required');
    }

    const assessment = await this.findOne(assessmentId);
    const results = await this.assessmentResultsRepository.find({
      where: { organizationId, assessmentId },
      order: { createdAt: 'DESC' },
    });

    const completed = results.filter((r) => this.isCompletedResult(r));
    const byUser = new Map<string, AssessmentResult[]>();
    completed.forEach((r) => {
      const list = byUser.get(r.userId) || [];
      list.push(r);
      byUser.set(r.userId, list);
    });

    const candidates = Array.from(byUser.entries())
      .map(([userId, attempts]) => {
        const sortedByDate = [...attempts].sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() -
            new Date(a.completedAt || a.createdAt).getTime(),
        );
        const latest = sortedByDate[0];
        const best = [...attempts].sort(
          (a, b) => (b.percentage || 0) - (a.percentage || 0),
        )[0];
        const selected = mode === 'latest' ? latest : best;
        return {
          userId,
          userName: this.candidateLabel(selected),
          storeId: selected.storeId,
          attempts: attempts.length,
          latestPercentage: latest?.percentage || 0,
          bestPercentage: best?.percentage || 0,
          percentage: selected?.percentage || 0,
          score: selected?.score || 0,
          passed: Boolean(selected?.passed),
          attemptNumber: selected?.attemptNumber || 1,
          timeTaken: selected?.timeTaken,
          completedAt: selected?.completedAt || selected?.createdAt,
          resultId: selected?.id,
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const passedCount = candidates.filter((c) => c.passed).length;
    return {
      assessment: {
        id: assessment?.id,
        title: assessment?.title,
        passingScore: assessment?.passingScore,
      },
      mode,
      summary: {
        candidates: candidates.length,
        passed: passedCount,
        failed: candidates.length - passedCount,
        passRate:
          candidates.length > 0
            ? Math.round((passedCount / candidates.length) * 100)
            : 0,
        avgScore:
          candidates.length > 0
            ? Math.round(
                candidates.reduce((sum, c) => sum + c.percentage, 0) / candidates.length,
              )
            : 0,
        topScore: candidates[0]?.percentage || 0,
      },
      candidates,
    };
  }

  async deleteAssessmentSubmission(submissionId: string): Promise<void> {
    await this.assessmentResultsRepository.delete(submissionId);
  }
}
