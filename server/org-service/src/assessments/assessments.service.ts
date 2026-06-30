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

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentsRepository: Repository<Assessment>,
    @InjectRepository(AssessmentResult)
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
    return this.findOne(id);
  }

  async publish(id: string): Promise<Assessment> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    await this.assessmentsRepository.update(id, {
      status: 'published',
      publishedAt: new Date(),
      isActive: true,
    });
    return this.findOne(id);
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

    return published.filter((assessment) => {
      const assigneeIds = assessment.assigneeIds ?? [];
      const storeIds = assessment.storeIds ?? [];
      if (assigneeIds.length === 0 && storeIds.length === 0) {
        return true;
      }
      return (
        assigneeIds.includes(userId) || (storeId ? storeIds.includes(storeId) : false)
      );
    });
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
  async getAssessmentReport(assessmentId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.assessmentResultsRepository.createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId })
      .andWhere('result.assessmentId = :assessmentId', { assessmentId });

    if (startDate) {
      query.andWhere('result.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('result.createdAt <= :endDate', { endDate });
    }

    return await query.orderBy('result.createdAt', 'DESC').getMany();
  }

  async getAssessmentOrgReport(organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.assessmentsRepository.createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.assessmentResults', 'assessmentResults')
      .where('assessment.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('assessment.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('assessment.createdAt <= :endDate', { endDate });
    }

    const assessments = await query.orderBy('assessment.createdAt', 'DESC').getMany();

    // Calculate submission counts for each assessment
    const assessmentData = assessments.map(assessment => {
      const submissionCount = assessment.assessmentResults?.length || 0;
      return {
        id: assessment.id,
        title: assessment.title,
        noOfSubmissions: submissionCount,
        status: assessment.isActive ? 'Active' : 'Inactive',
        createdAt: assessment.createdAt,
        description: assessment.description,
        passingScore: assessment.passingScore,
        duration: assessment.duration,
        allowRetake: assessment.allowRetake,
        maxAttempts: assessment.maxAttempts,
      };
    });

    return assessmentData;
  }

  async getAssessmentResultsReport(organizationId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.assessmentResultsRepository.createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('result.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('result.createdAt <= :endDate', { endDate });
    }

    const results = await query.orderBy('result.createdAt', 'DESC').getMany();

    return results.map((result) => ({
      id: result.id,
      name: result.assessment?.title ?? 'Assessment',
      user: result.userEmail ?? result.userId,
      score: result.percentage ?? result.score,
      status: result.passed ? 'Passed' : 'Failed',
      date: result.completedAt ?? result.createdAt,
      storeId: result.storeId,
    }));
  }

  async getAssessmentSubmissionList(assessmentId: string, organizationId: string): Promise<any[]> {
    const query = this.assessmentResultsRepository.createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.assessmentId = :assessmentId', { assessmentId })
      .andWhere('result.organizationId = :organizationId', { organizationId });

    const results = await query.orderBy('result.createdAt', 'DESC').getMany();

    return results.map(result => ({
      id: result.id,
      date: result.createdAt,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      attemptNumber: result.attemptNumber,
      storeId: result.storeId,
      submittedBy: result.userId,
      email: result.userEmail,
      status: result.status,
      percentage: result.percentage,
      score: result.score,
      assessmentId: result.assessmentId,
      assessmentTitle: result.assessment?.title,
    }));
  }

  async deleteAssessmentSubmission(submissionId: string): Promise<void> {
    await this.assessmentResultsRepository.delete(submissionId);
  }
}
