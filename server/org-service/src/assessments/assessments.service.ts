import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentsRepository: Repository<Assessment>,
    @InjectRepository(AssessmentResult)
    private assessmentResultsRepository: Repository<AssessmentResult>,
  ) {}

  // Assessment methods
  async create(assessmentData: Partial<Assessment>): Promise<Assessment> {
    const assessment = this.assessmentsRepository.create(assessmentData);
    return await this.assessmentsRepository.save(assessment);
  }

  async findAll(organizationId: string): Promise<Assessment[]> {
    return await this.assessmentsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
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

  async remove(id: string): Promise<void> {
    await this.assessmentsRepository.delete(id);
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
