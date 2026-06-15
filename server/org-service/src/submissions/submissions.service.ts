import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Submission } from './submission.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
  ) {}

  async create(submissionData: Partial<Submission>): Promise<Submission> {
    const submission = this.submissionsRepository.create(submissionData);
    return await this.submissionsRepository.save(submission);
  }

  async findAll(organizationId: string): Promise<Submission[]> {
    return await this.submissionsRepository.find({
      where: { organizationId },
      relations: ['process', 'audit'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingApprovals(userId: string, organizationId: string): Promise<Submission[]> {
    return await this.submissionsRepository.find({
      where: { organizationId, status: 'new' },
      relations: ['process', 'audit'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Submission> {
    return await this.submissionsRepository.findOne({
      where: { id },
      relations: ['process', 'audit'],
    });
  }

  async update(id: string, submissionData: Partial<Submission>): Promise<Submission> {
    await this.submissionsRepository.update(id, submissionData);
    return await this.findOne(id);
  }

  async approve(id: string, reviewerId: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission) throw new Error('Submission not found');

    const reviewHistory = submission.reviewHistory || [];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'approved',
      reviewerId,
      timestamp: new Date(),
    });

    return await this.update(id, {
      status: 'completed',
      currentReviewLevel: submission.currentReviewLevel + 1,
      reviewHistory,
    });
  }

  async sendForCorrection(id: string, reviewerId: string, correctionNotes: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission) throw new Error('Submission not found');

    const reviewHistory = submission.reviewHistory || [];
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
      reviewHistory,
    });
  }

  async reject(id: string, reviewerId: string, rejectionReason: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (!submission) throw new Error('Submission not found');

    const reviewHistory = submission.reviewHistory || [];
    reviewHistory.push({
      level: submission.currentReviewLevel,
      action: 'rejected',
      reviewerId,
      reason: rejectionReason,
      timestamp: new Date(),
    });

    return await this.update(id, {
      status: 'rejected',
      reviewHistory,
    });
  }

  async remove(id: string): Promise<void> {
    await this.submissionsRepository.delete(id);
  }

  // Report methods
  async getMyReport(userId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<Submission[]> {
    const query = this.submissionsRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId })
      .andWhere('submission.submittedBy = :userId', { userId });

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

    if (startDate) {
      query.andWhere('submission.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.createdAt <= :endDate', { endDate });
    }

    const submissions = await query.getMany();

    // Calculate analytics
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'new').length;
    const correctionSubmissions = submissions.filter(s => s.status === 'correction').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;

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
      relations: ['process', 'audit'],
      order: { dueDate: 'ASC' },
    });
  }
}
