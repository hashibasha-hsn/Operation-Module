import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';

@Injectable()
export class ExecutiveDashboardService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
  ) {}

  async getOrgSummary(organizationId: string, startDate?: Date, endDate?: Date, tagFilter?: string, metricType: 'count' | 'percentage' = 'percentage') {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.submittedAt <= :endDate', { endDate });
    }

    if (tagFilter) {
      query.andWhere('(process.processTag = :tagFilter OR audit.processTag = :tagFilter)', { tagFilter });
    }

    const submissions = await query.getMany();

    // Group by tag
    const tagGroups: Record<string, any> = {};
    submissions.forEach((submission: Submission) => {
      const tag = submission.process?.processTag || submission.audit?.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          totalExpected: 0,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
        };
      }
      tagGroups[tag].totalSubmitted++;
      if (submission.status === 'completed') {
        tagGroups[tag].totalCompliant++;
      }
    });

    // Calculate expected submissions based on process/audit assignments
    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });

    processes.forEach(process => {
      const tag = process.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          totalExpected: 0,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
        };
      }
      tagGroups[tag].totalExpected += (process.storeIds?.length || 0) * (process.assigneeIds?.length || 0);
    });

    audits.forEach(audit => {
      const tag = audit.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          totalExpected: 0,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
        };
      }
      tagGroups[tag].totalExpected += (audit.storeIds?.length || 0) * (audit.assigneeIds?.length || 0);
    });

    // Calculate percentages
    Object.values(tagGroups).forEach(group => {
      if (group.totalExpected > 0) {
        group.completionPercentage = Math.round((group.totalSubmitted / group.totalExpected) * 100);
      }
      if (group.totalSubmitted > 0) {
        group.compliancePercentage = Math.round((group.totalCompliant / group.totalSubmitted) * 100);
      }
    });

    // Convert to array and apply metric type
    const result = Object.values(tagGroups).map(group => {
      if (metricType === 'count') {
        return {
          tag: group.tag,
          completion: group.totalSubmitted,
          compliance: group.totalCompliant,
          expected: group.totalExpected,
        };
      }
      return {
        tag: group.tag,
        completion: group.completionPercentage,
        compliance: group.compliancePercentage,
      };
    });

    return result;
  }

  async getAllStores(organizationId: string, startDate?: Date, endDate?: Date, tagFilter?: string, periodicity: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.submittedAt <= :endDate', { endDate });
    }

    if (tagFilter) {
      query.andWhere('(process.processTag = :tagFilter OR audit.processTag = :tagFilter)', { tagFilter });
    }

    const submissions = await query.getMany();

    // Group by store
    const storeGroups: Record<string, any> = {};
    submissions.forEach((submission: Submission) => {
      const storeId = submission.storeId;
      if (!storeGroups[storeId]) {
        storeGroups[storeId] = {
          storeId,
          totalExpected: 0,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
          daily: [],
          weekly: [],
          monthly: [],
        };
      }
      storeGroups[storeId].totalSubmitted++;
      if (submission.status === 'completed') {
        storeGroups[storeId].totalCompliant++;
      }

      // Group by periodicity
      const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
      const dateKey = submittedDate.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(submittedDate);
      const monthKey = submittedDate.toISOString().slice(0, 7);

      storeGroups[storeId].daily.push({ date: dateKey, completed: submission.status === 'completed' });
      storeGroups[storeId].weekly.push({ date: weekKey, completed: submission.status === 'completed' });
      storeGroups[storeId].monthly.push({ date: monthKey, completed: submission.status === 'completed' });
    });

    // Calculate expected submissions per store
    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });

    Object.keys(storeGroups).forEach(storeId => {
      processes.forEach(process => {
        if (process.storeIds?.includes(storeId)) {
          storeGroups[storeId].totalExpected += process.assigneeIds?.length || 0;
        }
      });
      audits.forEach(audit => {
        if (audit.storeIds?.includes(storeId)) {
          storeGroups[storeId].totalExpected += audit.assigneeIds?.length || 0;
        }
      });

      if (storeGroups[storeId].totalExpected > 0) {
        storeGroups[storeId].completionPercentage = Math.round((storeGroups[storeId].totalSubmitted / storeGroups[storeId].totalExpected) * 100);
      }
      if (storeGroups[storeId].totalSubmitted > 0) {
        storeGroups[storeId].compliancePercentage = Math.round((storeGroups[storeId].totalCompliant / storeGroups[storeId].totalSubmitted) * 100);
      }
    });

    return Object.values(storeGroups);
  }

  async getHeatMap(organizationId: string, startDate?: Date, endDate?: Date, periodicity: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.submittedAt <= :endDate', { endDate });
    }

    const submissions = await query.getMany();

    // Create store-process matrix
    const matrix: Record<string, Record<string, any>> = {};
    const stores = new Set<string>();
    const processes = new Set<string>();

    submissions.forEach((submission: Submission) => {
      const storeId = submission.storeId;
      const processId = submission.workflowId;
      const processName = submission.process?.title || submission.audit?.title || 'Unknown';
      stores.add(storeId);
      processes.add(processId);

      if (!matrix[storeId]) {
        matrix[storeId] = {};
      }

      if (!matrix[storeId][processId]) {
        matrix[storeId][processId] = {
          processId,
          processName,
          totalExpected: 0,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
          color: 'red',
        };
      }

      matrix[storeId][processId].totalSubmitted++;
      if (submission.status === 'completed') {
        matrix[storeId][processId].totalCompliant++;
      }
    });

    // Calculate percentages and determine color
    Object.keys(matrix).forEach(storeId => {
      Object.keys(matrix[storeId]).forEach(processId => {
        const cell = matrix[storeId][processId];
        if (cell.totalSubmitted > 0) {
          cell.compliancePercentage = Math.round((cell.totalCompliant / cell.totalSubmitted) * 100);
        }

        // Determine color based on compliance percentage
        if (cell.compliancePercentage >= 80) {
          cell.color = 'green';
        } else if (cell.compliancePercentage >= 60) {
          cell.color = 'yellow';
        } else {
          cell.color = 'red';
        }
      });
    });

    return {
      stores: Array.from(stores),
      processes: Array.from(processes),
      matrix,
    };
  }

  async getSnapshot(organizationId: string, date?: Date, storeId?: string, processId?: string) {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.andWhere('submission.submittedAt >= :startOfDay', { startOfDay })
        .andWhere('submission.submittedAt <= :endOfDay', { endOfDay });
    }

    if (storeId) {
      query.andWhere('submission.storeId = :storeId', { storeId });
    }

    if (processId) {
      query.andWhere('submission.workflowId = :processId', { processId });
    }

    const submissions = await query.getMany();

    // Create snapshot matrix
    const snapshot: Record<string, any> = {};
    const stores = new Set<string>();
    const allProcesses = new Set<string>();

    // Get all processes for the organization
    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });

    processes.forEach(p => {
      allProcesses.add(p.id);
      p.storeIds?.forEach(s => stores.add(s));
    });
    audits.forEach(a => {
      allProcesses.add(a.id);
      a.storeIds?.forEach(s => stores.add(s));
    });

    // Initialize matrix
    Array.from(stores).forEach(store => {
      snapshot[store] = {
        storeId: store,
        average: 0,
        processes: {},
      };
      Array.from(allProcesses).forEach(procId => {
        snapshot[store].processes[procId] = {
          processId: procId,
          processName: processes.find(p => p.id === procId)?.title || audits.find(a => a.id === procId)?.title || 'Unknown',
          completionPercentage: 0,
          color: 'red',
        };
      });
    });

    // Fill matrix with submission data
    submissions.forEach((submission: Submission) => {
      const store = submission.storeId;
      const proc = submission.workflowId;
      if (snapshot[store] && snapshot[store].processes[proc]) {
        snapshot[store].processes[proc].completionPercentage = submission.status === 'completed' ? 100 : 0;
        snapshot[store].processes[proc].color = submission.status === 'completed' ? 'green' : 'red';
      }
    });

    // Calculate average per store
    Object.keys(snapshot).forEach(storeId => {
      const processValues = Object.values(snapshot[storeId].processes).map((p: any) => p.completionPercentage);
      if (processValues.length > 0) {
        snapshot[storeId].average = Math.round(processValues.reduce((a, b) => a + b, 0) / processValues.length);
      }
    });

    return {
      stores: Array.from(stores),
      processes: Array.from(allProcesses),
      snapshot,
    };
  }

  async getProcessTagInsights(organizationId: string, startDate?: Date, endDate?: Date, viewType: 'completion' | 'compliance' = 'completion') {
    const query = this.submissionRepository.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('submission.submittedAt <= :endDate', { endDate });
    }

    const submissions = await query.getMany();

    // Group by tag
    const tagGroups: Record<string, any> = {};
    submissions.forEach((submission: Submission) => {
      const tag = submission.process?.processTag || submission.audit?.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          expectedSubmissions: 0,
          totalSubmissions: 0,
          totalCompliant: 0,
          averageCompliance: 0,
        };
      }
      tagGroups[tag].totalSubmissions++;
      if (submission.status === 'completed') {
        tagGroups[tag].totalCompliant++;
      }
    });

    // Calculate expected submissions
    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });

    processes.forEach(process => {
      const tag = process.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          expectedSubmissions: 0,
          totalSubmissions: 0,
          totalCompliant: 0,
          averageCompliance: 0,
        };
      }
      tagGroups[tag].expectedSubmissions += (process.storeIds?.length || 0) * (process.assigneeIds?.length || 0);
    });

    audits.forEach(audit => {
      const tag = audit.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          expectedSubmissions: 0,
          totalSubmissions: 0,
          totalCompliant: 0,
          averageCompliance: 0,
        };
      }
      tagGroups[tag].expectedSubmissions += (audit.storeIds?.length || 0) * (audit.assigneeIds?.length || 0);
    });

    // Calculate average compliance
    Object.values(tagGroups).forEach(group => {
      if (group.totalSubmissions > 0) {
        group.averageCompliance = Math.round((group.totalCompliant / group.totalSubmissions) * 100);
      }
    });

    const result = Object.values(tagGroups).map(group => {
      if (viewType === 'completion') {
        return {
          tag: group.tag,
          expectedSubmissions: group.expectedSubmissions,
          totalSubmissions: group.totalSubmissions,
        };
      }
      return {
        tag: group.tag,
        averageCompliance: group.averageCompliance,
      };
    });

    return result;
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}
