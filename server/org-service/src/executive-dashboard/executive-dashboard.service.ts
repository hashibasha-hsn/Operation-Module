import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { BusinessEntity } from '../entities/entity.entity';

export type TagDimension = 'region' | 'brand' | 'department' | 'processTag';

export interface StoreMeta {
  storeId: string;
  storeName: string;
  region: string;
  brand: string;
  department: string;
}

@Injectable()
export class ExecutiveDashboardService {
  constructor(
    @InjectRepository(Submission, 'org')
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Process, 'org')
    private processRepository: Repository<Process>,
    @InjectRepository(Audit, 'org')
    private auditRepository: Repository<Audit>,
    @InjectRepository(BusinessEntity, 'org')
    private entityRepository: Repository<BusinessEntity>,
  ) {}

  private extractTagValue(tags: any, keys: string[]): string | undefined {
    if (!tags) return undefined;
    if (Array.isArray(tags)) {
      for (const item of tags) {
        if (typeof item === 'string') {
          for (const key of keys) {
            if (item.toLowerCase().startsWith(`${key.toLowerCase()}:`)) {
              return item.split(':').slice(1).join(':').trim();
            }
          }
        } else if (item && typeof item === 'object') {
          for (const key of keys) {
            const val = item[key] ?? item[key.toLowerCase()];
            if (val) return String(val);
          }
        }
      }
      return undefined;
    }
    if (typeof tags === 'object') {
      for (const key of keys) {
        const val = tags[key] ?? tags[key.toLowerCase()];
        if (val) return String(val);
      }
    }
    return undefined;
  }

  private toStoreMeta(entity: BusinessEntity): StoreMeta {
    const brand =
      this.extractTagValue(entity.tags, ['Brand', 'brand']) ||
      entity.businessCategory ||
      'Unassigned';
    const department =
      this.extractTagValue(entity.tags, ['Department', 'department']) ||
      entity.area ||
      'Unassigned';
    return {
      storeId: entity.id,
      storeName: entity.storeName || entity.entityId || entity.id,
      region: entity.region || 'Unassigned',
      brand,
      department,
    };
  }

  private async getStoreMetaMap(organizationId: string): Promise<Map<string, StoreMeta>> {
    const entities = await this.entityRepository.find({ where: { organizationId } });
    const map = new Map<string, StoreMeta>();
    entities.forEach((entity) => {
      const meta = this.toStoreMeta(entity);
      map.set(entity.id, meta);
      if (entity.entityId) map.set(entity.entityId, meta);
    });
    return map;
  }

  private async resolveStoreIdsByDimensions(
    organizationId: string,
    filters: { region?: string; brand?: string; department?: string },
  ): Promise<string[] | null> {
    const hasFilter = Boolean(filters.region || filters.brand || filters.department);
    if (!hasFilter) return null;

    const metaMap = await this.getStoreMetaMap(organizationId);
    const matched = new Set<string>();
    metaMap.forEach((meta, key) => {
      if (filters.region && filters.region !== 'all' && meta.region !== filters.region) return;
      if (filters.brand && filters.brand !== 'all' && meta.brand !== filters.brand) return;
      if (filters.department && filters.department !== 'all' && meta.department !== filters.department) return;
      matched.add(meta.storeId);
      matched.add(key);
    });
    return Array.from(matched);
  }

  private applyDateAndTagFilters(
    query: any,
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
  ) {
    if (startDate) {
      query.andWhere('submission.submittedAt >= :startDate', { startDate });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('submission.submittedAt <= :endDate', { endDate: end });
    }
    if (tagFilter && tagFilter !== 'all') {
      query.andWhere('(process.processTag = :tagFilter OR audit.processTag = :tagFilter)', {
        tagFilter,
      });
    }
    return query;
  }

  private async loadSubmissions(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      tagFilter?: string;
      region?: string;
      brand?: string;
      department?: string;
      storeId?: string;
      processId?: string;
    } = {},
  ) {
    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.process', 'process')
      .leftJoinAndSelect('submission.audit', 'audit')
      .where('submission.organizationId = :organizationId', { organizationId });

    this.applyDateAndTagFilters(query, options.startDate, options.endDate, options.tagFilter);

    if (options.storeId) {
      query.andWhere('submission.storeId = :storeId', { storeId: options.storeId });
    }
    if (options.processId) {
      query.andWhere('submission.workflowId = :processId', { processId: options.processId });
    }

    const storeIds = await this.resolveStoreIdsByDimensions(organizationId, {
      region: options.region,
      brand: options.brand,
      department: options.department,
    });
    if (storeIds) {
      if (storeIds.length === 0) return [];
      query.andWhere('submission.storeId IN (:...storeIds)', { storeIds });
    }

    return query.getMany();
  }

  async getFilterOptions(organizationId: string) {
    const metaMap = await this.getStoreMetaMap(organizationId);
    const regions = new Set<string>();
    const brands = new Set<string>();
    const departments = new Set<string>();
    const stores: StoreMeta[] = [];
    const seen = new Set<string>();

    metaMap.forEach((meta) => {
      if (seen.has(meta.storeId)) return;
      seen.add(meta.storeId);
      stores.push(meta);
      if (meta.region) regions.add(meta.region);
      if (meta.brand) brands.add(meta.brand);
      if (meta.department) departments.add(meta.department);
    });

    const processes = await this.processRepository.find({
      where: { organizationId, isActive: true },
    });
    const audits = await this.auditRepository.find({
      where: { organizationId, isActive: true },
    });
    const processTags = new Set<string>();
    processes.forEach((p) => p.processTag && processTags.add(p.processTag));
    audits.forEach((a) => a.processTag && processTags.add(a.processTag));

    return {
      regions: Array.from(regions).sort(),
      brands: Array.from(brands).sort(),
      departments: Array.from(departments).sort(),
      processTags: Array.from(processTags).sort(),
      stores: stores.sort((a, b) => a.storeName.localeCompare(b.storeName)),
      processes: [
        ...processes.map((p) => ({ id: p.id, title: p.title, processTag: p.processTag || 'Uncategorized' })),
        ...audits.map((a) => ({ id: a.id, title: a.title, processTag: a.processTag || 'Uncategorized' })),
      ],
    };
  }

  async getOrgSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
    metricType: 'count' | 'percentage' = 'percentage',
    region?: string,
    brand?: string,
    department?: string,
  ) {
    const submissions = await this.loadSubmissions(organizationId, {
      startDate,
      endDate,
      tagFilter,
      region,
      brand,
      department,
    });

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

    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });
    const storeIds = await this.resolveStoreIdsByDimensions(organizationId, { region, brand, department });

    const countExpected = (ids?: string[], assignees?: string[]) => {
      if (!ids?.length) return 0;
      const filtered = storeIds ? ids.filter((id) => storeIds.includes(id)) : ids;
      return filtered.length * (assignees?.length || 0);
    };

    processes.forEach((process) => {
      if (tagFilter && tagFilter !== 'all' && process.processTag !== tagFilter) return;
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
      tagGroups[tag].totalExpected += countExpected(process.storeIds, process.assigneeIds);
    });

    audits.forEach((audit) => {
      if (tagFilter && tagFilter !== 'all' && audit.processTag !== tagFilter) return;
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
      tagGroups[tag].totalExpected += countExpected(audit.storeIds, audit.assigneeIds);
    });

    Object.values(tagGroups).forEach((group: any) => {
      if (group.totalExpected > 0) {
        group.completionPercentage = Math.round((group.totalSubmitted / group.totalExpected) * 100);
      }
      if (group.totalSubmitted > 0) {
        group.compliancePercentage = Math.round((group.totalCompliant / group.totalSubmitted) * 100);
      }
    });

    return Object.values(tagGroups).map((group: any) => {
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
        expected: group.totalExpected,
        totalSubmitted: group.totalSubmitted,
        totalCompliant: group.totalCompliant,
      };
    });
  }

  async getOverview(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
    region?: string,
    brand?: string,
    department?: string,
    periodicity: 'daily' | 'weekly' | 'monthly' = 'daily',
    metricType: 'count' | 'percentage' = 'percentage',
  ) {
    const [submissions, metaMap, orgSummary] = await Promise.all([
      this.loadSubmissions(organizationId, { startDate, endDate, tagFilter, region, brand, department }),
      this.getStoreMetaMap(organizationId),
      this.getOrgSummary(organizationId, startDate, endDate, tagFilter, metricType, region, brand, department),
    ]);

    const storeIds = new Set(submissions.map((s) => s.storeId));
    const trackedStores = new Set<string>();
    const seenMeta = new Set<string>();
    metaMap.forEach((meta) => {
      if (seenMeta.has(meta.storeId)) return;
      seenMeta.add(meta.storeId);
      if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
      trackedStores.add(meta.storeId);
    });
    storeIds.forEach((id) => trackedStores.add(id));

    const totalSubmitted = submissions.length;
    const totalCompliant = submissions.filter((s) => s.status === 'completed').length;
    const overallCompliance = totalSubmitted > 0 ? Math.round((totalCompliant / totalSubmitted) * 100) : 0;

    let totalExpected = 0;
    orgSummary.forEach((row: any) => {
      totalExpected += row.expected || 0;
    });
    const overallCompletion =
      totalExpected > 0 ? Math.min(100, Math.round((totalSubmitted / totalExpected) * 100)) : 0;

    const trendBuckets: Record<string, { period: string; submitted: number; compliant: number }> = {};
    submissions.forEach((submission) => {
      const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
      let period: string;
      if (periodicity === 'monthly') {
        period = submittedDate.toISOString().slice(0, 7);
      } else if (periodicity === 'weekly') {
        period = this.getWeekKey(submittedDate);
      } else {
        period = submittedDate.toISOString().split('T')[0];
      }
      if (!trendBuckets[period]) {
        trendBuckets[period] = { period, submitted: 0, compliant: 0 };
      }
      trendBuckets[period].submitted++;
      if (submission.status === 'completed') trendBuckets[period].compliant++;
    });

    const trends = Object.values(trendBuckets)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((bucket) => ({
        period: bucket.period,
        submitted: bucket.submitted,
        compliant: bucket.compliant,
        compliancePercentage:
          bucket.submitted > 0 ? Math.round((bucket.compliant / bucket.submitted) * 100) : 0,
        completionPercentage:
          totalExpected > 0
            ? Math.min(100, Math.round((bucket.submitted / Math.max(totalExpected / Math.max(Object.keys(trendBuckets).length, 1), 1)) * 100))
            : 0,
      }));

    const processGroups: Record<string, { name: string; submitted: number; compliant: number }> = {};
    submissions.forEach((submission) => {
      const name = submission.process?.title || submission.audit?.title || 'Unknown';
      if (!processGroups[name]) {
        processGroups[name] = { name, submitted: 0, compliant: 0 };
      }
      processGroups[name].submitted++;
      if (submission.status === 'completed') processGroups[name].compliant++;
    });

    const processCompletion = Object.values(processGroups)
      .map((p) => ({
        name: p.name,
        submitted: p.submitted,
        compliant: p.compliant,
        compliancePercentage: p.submitted > 0 ? Math.round((p.compliant / p.submitted) * 100) : 0,
      }))
      .sort((a, b) => b.compliancePercentage - a.compliancePercentage)
      .slice(0, 10);

    const regionGroups: Record<string, { name: string; submitted: number; compliant: number; stores: Set<string> }> = {};
    const seenStores = new Set<string>();
    metaMap.forEach((meta) => {
      if (seenStores.has(meta.storeId)) return;
      seenStores.add(meta.storeId);
      if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
      const name = meta.region || 'Unassigned';
      if (!regionGroups[name]) {
        regionGroups[name] = { name, submitted: 0, compliant: 0, stores: new Set() };
      }
      regionGroups[name].stores.add(meta.storeId);
    });
    submissions.forEach((submission) => {
      const meta = metaMap.get(submission.storeId);
      const name = meta?.region || 'Unassigned';
      if (!regionGroups[name]) {
        regionGroups[name] = { name, submitted: 0, compliant: 0, stores: new Set() };
      }
      regionGroups[name].submitted++;
      regionGroups[name].stores.add(submission.storeId);
      if (submission.status === 'completed') regionGroups[name].compliant++;
    });

    const regionCompliance = Object.values(regionGroups).map((r) => ({
      name: r.name,
      stores: r.stores.size,
      submitted: r.submitted,
      compliant: r.compliant,
      compliancePercentage: r.submitted > 0 ? Math.round((r.compliant / r.submitted) * 100) : 0,
    }));

    return {
      kpis: {
        overallCompliance,
        overallCompletion,
        totalStores: trackedStores.size,
        activeStores: trackedStores.size,
        totalSubmitted,
        totalCompliant,
        totalExpected,
        pending: Math.max(totalExpected - totalSubmitted, 0),
      },
      trends,
      processCompletion,
      regionCompliance,
      tagSummary: orgSummary,
    };
  }

  private createEmptyStoreGroup(storeId: string, meta?: StoreMeta) {
    return {
      storeId,
      storeName: meta?.storeName || storeId,
      region: meta?.region || 'Unassigned',
      brand: meta?.brand || 'Unassigned',
      department: meta?.department || 'Unassigned',
      totalExpected: 0,
      totalSubmitted: 0,
      totalCompliant: 0,
      completionPercentage: 0,
      compliancePercentage: 0,
      trend: [] as { period: string; compliant: number; submitted: number }[],
    };
  }

  private matchesMetaFilters(
    meta: StoreMeta | undefined,
    filters: { region?: string; brand?: string; department?: string },
  ) {
    if (filters.region && filters.region !== 'all' && (meta?.region || 'Unassigned') !== filters.region) {
      return false;
    }
    if (filters.brand && filters.brand !== 'all' && (meta?.brand || 'Unassigned') !== filters.brand) {
      return false;
    }
    if (
      filters.department &&
      filters.department !== 'all' &&
      (meta?.department || 'Unassigned') !== filters.department
    ) {
      return false;
    }
    return true;
  }

  async getAllStores(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
    periodicity: 'daily' | 'weekly' | 'monthly' = 'daily',
    region?: string,
    brand?: string,
    department?: string,
  ) {
    const [submissions, metaMap, processes, audits] = await Promise.all([
      this.loadSubmissions(organizationId, { startDate, endDate, tagFilter, region, brand, department }),
      this.getStoreMetaMap(organizationId),
      this.processRepository.find({ where: { organizationId, isActive: true } }),
      this.auditRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const storeGroups: Record<string, any> = {};
    const ensureStore = (storeId: string) => {
      if (!storeGroups[storeId]) {
        storeGroups[storeId] = this.createEmptyStoreGroup(storeId, metaMap.get(storeId));
      }
      return storeGroups[storeId];
    };

    // Seed from known entities (so stores show even with zero submissions)
    const seenMeta = new Set<string>();
    metaMap.forEach((meta) => {
      if (seenMeta.has(meta.storeId)) return;
      seenMeta.add(meta.storeId);
      if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
      ensureStore(meta.storeId);
    });

    // Also seed stores assigned on processes/audits
    [...processes, ...audits].forEach((item: any) => {
      if (tagFilter && tagFilter !== 'all' && item.processTag !== tagFilter) return;
      (item.storeIds || []).forEach((storeId: string) => {
        const meta = metaMap.get(storeId);
        if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
        ensureStore(storeId);
      });
    });

    submissions.forEach((submission: Submission) => {
      const storeId = submission.storeId;
      const group = ensureStore(storeId);
      group.totalSubmitted++;
      if (submission.status === 'completed') {
        group.totalCompliant++;
      }

      const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
      let period: string;
      if (periodicity === 'monthly') period = submittedDate.toISOString().slice(0, 7);
      else if (periodicity === 'weekly') period = this.getWeekKey(submittedDate);
      else period = submittedDate.toISOString().split('T')[0];

      group.trend.push({
        period,
        compliant: submission.status === 'completed' ? 1 : 0,
        submitted: 1,
      });
    });

    Object.keys(storeGroups).forEach((storeId) => {
      processes.forEach((process) => {
        if (tagFilter && tagFilter !== 'all' && process.processTag !== tagFilter) return;
        if (process.storeIds?.includes(storeId)) {
          storeGroups[storeId].totalExpected += process.assigneeIds?.length || 1;
        }
      });
      audits.forEach((audit) => {
        if (tagFilter && tagFilter !== 'all' && audit.processTag !== tagFilter) return;
        if (audit.storeIds?.includes(storeId)) {
          storeGroups[storeId].totalExpected += audit.assigneeIds?.length || 1;
        }
      });

      if (storeGroups[storeId].totalExpected > 0) {
        storeGroups[storeId].completionPercentage = Math.round(
          (storeGroups[storeId].totalSubmitted / storeGroups[storeId].totalExpected) * 100,
        );
      }
      if (storeGroups[storeId].totalSubmitted > 0) {
        storeGroups[storeId].compliancePercentage = Math.round(
          (storeGroups[storeId].totalCompliant / storeGroups[storeId].totalSubmitted) * 100,
        );
      }

      const trendMap: Record<string, { period: string; compliant: number; submitted: number }> = {};
      storeGroups[storeId].trend.forEach((t: any) => {
        if (!trendMap[t.period]) trendMap[t.period] = { period: t.period, compliant: 0, submitted: 0 };
        trendMap[t.period].compliant += t.compliant;
        trendMap[t.period].submitted += t.submitted;
      });
      storeGroups[storeId].trend = Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
    });

    return Object.values(storeGroups).sort((a: any, b: any) =>
      a.storeName.localeCompare(b.storeName),
    );
  }

  async getStoreDetail(
    organizationId: string,
    storeId: string,
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
  ) {
    const [submissions, metaMap, processes, audits] = await Promise.all([
      this.loadSubmissions(organizationId, { startDate, endDate, tagFilter, storeId }),
      this.getStoreMetaMap(organizationId),
      this.processRepository.find({ where: { organizationId, isActive: true } }),
      this.auditRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const meta = metaMap.get(storeId) || {
      storeId,
      storeName: storeId,
      region: 'Unassigned',
      brand: 'Unassigned',
      department: 'Unassigned',
    };

    const processMap: Record<string, any> = {};
    [...processes, ...audits].forEach((item: any) => {
      if (!item.storeIds?.includes(storeId)) return;
      if (tagFilter && tagFilter !== 'all' && item.processTag !== tagFilter) return;
      processMap[item.id] = {
        processId: item.id,
        processName: item.title,
        processTag: item.processTag || 'Uncategorized',
        priority: item.properties?.processPriority ? Number(item.properties.processPriority) : 3,
        expected: item.assigneeIds?.length || 1,
        submitted: 0,
        compliant: 0,
        completionPercentage: 0,
        compliancePercentage: 0,
        status: 'pending',
      };
    });

    submissions.forEach((submission) => {
      const id = submission.workflowId;
      if (!processMap[id]) {
        processMap[id] = {
          processId: id,
          processName: submission.process?.title || submission.audit?.title || 'Unknown',
          processTag: submission.process?.processTag || submission.audit?.processTag || 'Uncategorized',
          priority: submission.process?.properties?.processPriority
            ? Number(submission.process.properties.processPriority)
            : 3,
          expected: 1,
          submitted: 0,
          compliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
          status: 'pending',
        };
      }
      processMap[id].submitted++;
      if (submission.status === 'completed') processMap[id].compliant++;
    });

    const processDetails = Object.values(processMap).map((p: any) => {
      p.completionPercentage = p.expected > 0 ? Math.round((p.submitted / p.expected) * 100) : 0;
      p.compliancePercentage = p.submitted > 0 ? Math.round((p.compliant / p.submitted) * 100) : 0;
      p.status =
        p.compliancePercentage >= 80 ? 'healthy' : p.compliancePercentage >= 60 ? 'warning' : 'critical';
      return p;
    });

    const totalSubmitted = submissions.length;
    const totalCompliant = submissions.filter((s) => s.status === 'completed').length;
    const totalExpected = processDetails.reduce((sum: number, p: any) => sum + p.expected, 0);

    return {
      ...meta,
      totalSubmitted,
      totalCompliant,
      totalExpected,
      completionPercentage: totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0,
      compliancePercentage: totalSubmitted > 0 ? Math.round((totalCompliant / totalSubmitted) * 100) : 0,
      processes: processDetails.sort(
        (a: any, b: any) => (a.priority - b.priority) || a.processName.localeCompare(b.processName),
      ),
      recentSubmissions: submissions
        .slice()
        .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
        .slice(0, 20)
        .map((s) => ({
          id: s.id,
          processName: s.process?.title || s.audit?.title || 'Unknown',
          status: s.status,
          submittedAt: s.submittedAt,
          submittedBy: s.submittedBy || '',
        })),
    };
  }

  async getHeatMap(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    periodicity: 'daily' | 'weekly' | 'monthly' = 'daily',
    tagFilter?: string,
    region?: string,
    brand?: string,
    department?: string,
  ) {
    const [submissions, metaMap, processes, audits] = await Promise.all([
      this.loadSubmissions(organizationId, { startDate, endDate, tagFilter, region, brand, department }),
      this.getStoreMetaMap(organizationId),
      this.processRepository.find({ where: { organizationId, isActive: true } }),
      this.auditRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const matrix: Record<string, Record<string, any>> = {};
    const stores = new Set<string>();
    const processIds = new Set<string>();
    const processNames: Record<string, string> = {};

    const ensureCell = (storeId: string, processId: string, processName: string) => {
      stores.add(storeId);
      processIds.add(processId);
      const cleanedName =
        processName &&
        processName.trim() &&
        processName !== processId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(processName.trim())
          ? processName.trim()
          : undefined;
      if (cleanedName) {
        const existing = processNames[processId];
        const existingIsBad =
          !existing ||
          existing === processId ||
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing);
        if (existingIsBad) processNames[processId] = cleanedName;
      }
      if (!matrix[storeId]) matrix[storeId] = {};
      if (!matrix[storeId][processId]) {
        matrix[storeId][processId] = {
          processId,
          processName: processNames[processId] || 'Untitled',
          totalExpected: 1,
          totalSubmitted: 0,
          totalCompliant: 0,
          completionPercentage: 0,
          compliancePercentage: 0,
          color: 'red',
        };
      } else if (cleanedName) {
        matrix[storeId][processId].processName = processNames[processId] || cleanedName;
      }
      return matrix[storeId][processId];
    };

    // Seed matrix from process/audit store assignments
    [...processes, ...audits].forEach((item: any) => {
      if (tagFilter && tagFilter !== 'all' && item.processTag !== tagFilter) return;
      const storeIds = item.storeIds || [];
      storeIds.forEach((storeId: string) => {
        const meta = metaMap.get(storeId);
        if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
        ensureCell(storeId, item.id, item.title);
      });
    });

    // If no assignments, still show entities × active processes so the heat map isn't blank
    if (stores.size === 0) {
      const seen = new Set<string>();
      metaMap.forEach((meta) => {
        if (seen.has(meta.storeId)) return;
        seen.add(meta.storeId);
        if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
        [...processes, ...audits].forEach((item: any) => {
          if (tagFilter && tagFilter !== 'all' && item.processTag !== tagFilter) return;
          ensureCell(meta.storeId, item.id, item.title);
        });
      });
    }

    submissions.forEach((submission: Submission) => {
      const storeId = submission.storeId;
      const processId = submission.workflowId;
      const processName = submission.process?.title || submission.audit?.title || processId;
      const cell = ensureCell(storeId, processId, processName);
      cell.totalSubmitted++;
      if (submission.status === 'completed') {
        cell.totalCompliant++;
      }
    });

    Object.keys(matrix).forEach((storeId) => {
      Object.keys(matrix[storeId]).forEach((processId) => {
        const cell = matrix[storeId][processId];
        if (cell.totalSubmitted > 0) {
          cell.compliancePercentage = Math.round((cell.totalCompliant / cell.totalSubmitted) * 100);
          cell.completionPercentage = Math.min(
            100,
            Math.round((cell.totalSubmitted / Math.max(cell.totalExpected, 1)) * 100),
          );
        }
        if (cell.compliancePercentage >= 80) cell.color = 'green';
        else if (cell.compliancePercentage >= 60) cell.color = 'yellow';
        else cell.color = 'red';
      });
    });

    const storeList = Array.from(stores).map((storeId) => {
      const meta = metaMap.get(storeId);
      const storeName =
        meta?.storeName &&
        meta.storeName !== storeId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(meta.storeName)
          ? meta.storeName
          : 'Unnamed store';
      return {
        storeId,
        storeName,
        region: meta?.region || 'Unassigned',
        brand: meta?.brand || 'Unassigned',
        department: meta?.department || 'Unassigned',
      };
    });

    const priorityMap: Record<string, number> = {};
    [...processes, ...audits].forEach((item: any) => {
      const val = item.properties?.processPriority;
      priorityMap[item.id] = val ? Number(val) : 3;
    });

    const processList = Array.from(processIds).map((id) => ({
      processId: id,
      processName:
        processNames[id] &&
        processNames[id] !== id &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(processNames[id])
          ? processNames[id]
          : 'Untitled',
      priority: priorityMap[id] ?? 3,
    }));

    return {
      stores: storeList,
      processes: processList.sort(
        (a: any, b: any) => (a.priority - b.priority) || a.processName.localeCompare(b.processName),
      ),
      matrix,
      periodicity,
    };
  }

  async getSnapshot(
    organizationId: string,
    date?: Date,
    storeId?: string,
    processId?: string,
    region?: string,
    brand?: string,
    department?: string,
    tagFilter?: string,
  ) {
    const queryOptions: any = { storeId, processId, region, brand, department, tagFilter };
    if (date) {
      queryOptions.startDate = date;
      queryOptions.endDate = date;
    }

    const [submissions, metaMap, processes, audits] = await Promise.all([
      this.loadSubmissions(organizationId, queryOptions),
      this.getStoreMetaMap(organizationId),
      this.processRepository.find({ where: { organizationId, isActive: true } }),
      this.auditRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const snapshot: Record<string, any> = {};
    const storeSet = new Set<string>();
    const allProcesses = new Set<string>();
    const processNames: Record<string, string> = {};
    const dimensionStoreIds = await this.resolveStoreIdsByDimensions(organizationId, {
      region,
      brand,
      department,
    });

    const includeStore = (id: string) => {
      if (storeId && id !== storeId) return false;
      if (dimensionStoreIds && !dimensionStoreIds.includes(id)) return false;
      return true;
    };

    processes.forEach((p) => {
      if (tagFilter && tagFilter !== 'all' && p.processTag !== tagFilter) return;
      if (processId && p.id !== processId) return;
      allProcesses.add(p.id);
      processNames[p.id] = p.title;
      p.storeIds?.forEach((s) => {
        if (includeStore(s)) storeSet.add(s);
      });
    });
    audits.forEach((a) => {
      if (tagFilter && tagFilter !== 'all' && a.processTag !== tagFilter) return;
      if (processId && a.id !== processId) return;
      allProcesses.add(a.id);
      processNames[a.id] = a.title;
      a.storeIds?.forEach((s) => {
        if (includeStore(s)) storeSet.add(s);
      });
    });

    // Include stores that have submissions even if not in current assignments
    submissions.forEach((s) => {
      if (includeStore(s.storeId)) storeSet.add(s.storeId);
      allProcesses.add(s.workflowId);
      if (!processNames[s.workflowId]) {
        const title = s.process?.title || s.audit?.title;
        if (
          title &&
          title !== s.workflowId &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title)
        ) {
          processNames[s.workflowId] = title;
        }
      }
    });

    Array.from(storeSet).forEach((store) => {
      const metaName = metaMap.get(store)?.storeName;
      const storeName =
        metaName &&
        metaName !== store &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metaName)
          ? metaName
          : 'Unnamed store';
      snapshot[store] = {
        storeId: store,
        storeName,
        region: metaMap.get(store)?.region || 'Unassigned',
        brand: metaMap.get(store)?.brand || 'Unassigned',
        department: metaMap.get(store)?.department || 'Unassigned',
        average: 0,
        processes: {},
      };
      Array.from(allProcesses).forEach((procId) => {
        snapshot[store].processes[procId] = {
          processId: procId,
          processName: processNames[procId] || 'Unknown',
          completionPercentage: 0,
          color: 'red',
        };
      });
    });

    submissions.forEach((submission: Submission) => {
      const store = submission.storeId;
      const proc = submission.workflowId;
      if (snapshot[store]?.processes[proc]) {
        snapshot[store].processes[proc].completionPercentage =
          submission.status === 'completed' ? 100 : 0;
        snapshot[store].processes[proc].color =
          submission.status === 'completed' ? 'green' : 'red';
      }
    });

    Object.keys(snapshot).forEach((sid) => {
      const processValues = Object.values(snapshot[sid].processes).map(
        (p: any) => p.completionPercentage,
      );
      if (processValues.length > 0) {
        snapshot[sid].average = Math.round(
          processValues.reduce((a: number, b: number) => a + b, 0) / processValues.length,
        );
      }
    });

    const priorityMap: Record<string, number> = {};
    processes.forEach((p: any) => {
      const val = p.properties?.processPriority;
      priorityMap[p.id] = val ? Number(val) : 3;
    });

    const processList = Array.from(allProcesses).map((id) => {
      const name = processNames[id];
      const processName =
        name &&
        name !== id &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name)
          ? name
          : 'Untitled';
      return { processId: id, processName, priority: priorityMap[id] ?? 3 };
    });

    return {
      stores: Array.from(storeSet).map((sid) => {
        const name = metaMap.get(sid)?.storeName;
        const storeName =
          name &&
          name !== sid &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name)
            ? name
            : 'Unnamed store';
        return {
          storeId: sid,
          storeName,
          region: metaMap.get(sid)?.region || 'Unassigned',
          brand: metaMap.get(sid)?.brand || 'Unassigned',
          department: metaMap.get(sid)?.department || 'Unassigned',
        };
      }),
      processes: processList.sort(
        (a: any, b: any) => (a.priority - b.priority) || a.processName.localeCompare(b.processName),
      ),
      snapshot,
    };
  }

  async getProcessTagInsights(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    viewType: 'completion' | 'compliance' = 'completion',
    region?: string,
    brand?: string,
    department?: string,
  ) {
    const submissions = await this.loadSubmissions(organizationId, {
      startDate,
      endDate,
      region,
      brand,
      department,
    });

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
          averageCompletion: 0,
        };
      }
      tagGroups[tag].totalSubmissions++;
      if (submission.status === 'completed') {
        tagGroups[tag].totalCompliant++;
      }
    });

    const processes = await this.processRepository.find({ where: { organizationId, isActive: true } });
    const audits = await this.auditRepository.find({ where: { organizationId, isActive: true } });
    const storeIds = await this.resolveStoreIdsByDimensions(organizationId, { region, brand, department });

    const countExpected = (ids?: string[], assignees?: string[]) => {
      if (!ids?.length) return 0;
      const filtered = storeIds ? ids.filter((id) => storeIds.includes(id)) : ids;
      return filtered.length * (assignees?.length || 0);
    };

    processes.forEach((process) => {
      const tag = process.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          expectedSubmissions: 0,
          totalSubmissions: 0,
          totalCompliant: 0,
          averageCompliance: 0,
          averageCompletion: 0,
        };
      }
      tagGroups[tag].expectedSubmissions += countExpected(process.storeIds, process.assigneeIds);
    });

    audits.forEach((audit) => {
      const tag = audit.processTag || 'Uncategorized';
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          tag,
          expectedSubmissions: 0,
          totalSubmissions: 0,
          totalCompliant: 0,
          averageCompliance: 0,
          averageCompletion: 0,
        };
      }
      tagGroups[tag].expectedSubmissions += countExpected(audit.storeIds, audit.assigneeIds);
    });

    Object.values(tagGroups).forEach((group: any) => {
      if (group.totalSubmissions > 0) {
        group.averageCompliance = Math.round((group.totalCompliant / group.totalSubmissions) * 100);
      }
      if (group.expectedSubmissions > 0) {
        group.averageCompletion = Math.round((group.totalSubmissions / group.expectedSubmissions) * 100);
      }
    });

    return Object.values(tagGroups).map((group: any) => ({
      tag: group.tag,
      expectedSubmissions: group.expectedSubmissions,
      totalSubmissions: group.totalSubmissions,
      totalCompliant: group.totalCompliant,
      averageCompliance: group.averageCompliance,
      averageCompletion: group.averageCompletion,
      viewType,
    }));
  }

  async getTagAnalysis(
    organizationId: string,
    dimension: TagDimension = 'region',
    startDate?: Date,
    endDate?: Date,
    tagFilter?: string,
    region?: string,
    brand?: string,
    department?: string,
  ) {
    const [submissions, metaMap, processes, audits] = await Promise.all([
      this.loadSubmissions(organizationId, { startDate, endDate, tagFilter, region, brand, department }),
      this.getStoreMetaMap(organizationId),
      this.processRepository.find({ where: { organizationId, isActive: true } }),
      this.auditRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const groups: Record<string, any> = {};
    const ensureGroup = (key: string) => {
      if (!groups[key]) {
        groups[key] = {
          name: key,
          dimension,
          stores: new Set<string>(),
          totalSubmitted: 0,
          totalCompliant: 0,
          compliancePercentage: 0,
          completionPercentage: 0,
        };
      }
      return groups[key];
    };

    const dimensionKeyForMeta = (meta: StoreMeta) => {
      if (dimension === 'brand') return meta.brand || 'Unassigned';
      if (dimension === 'department') return meta.department || 'Unassigned';
      if (dimension === 'processTag') return null;
      return meta.region || 'Unassigned';
    };

    // Seed groups from store metadata / process tags so charts aren't blank
    if (dimension === 'processTag') {
      [...processes, ...audits].forEach((item: any) => {
        if (tagFilter && tagFilter !== 'all' && item.processTag !== tagFilter) return;
        const key = item.processTag || 'Uncategorized';
        const group = ensureGroup(key);
        (item.storeIds || []).forEach((storeId: string) => {
          const meta = metaMap.get(storeId);
          if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
          group.stores.add(storeId);
        });
      });
    } else {
      const seen = new Set<string>();
      metaMap.forEach((meta) => {
        if (seen.has(meta.storeId)) return;
        seen.add(meta.storeId);
        if (!this.matchesMetaFilters(meta, { region, brand, department })) return;
        const key = dimensionKeyForMeta(meta);
        if (!key) return;
        ensureGroup(key).stores.add(meta.storeId);
      });
    }

    submissions.forEach((submission) => {
      const meta = metaMap.get(submission.storeId);
      let key: string;
      if (dimension === 'brand') key = meta?.brand || 'Unassigned';
      else if (dimension === 'department') key = meta?.department || 'Unassigned';
      else if (dimension === 'processTag') {
        key = submission.process?.processTag || submission.audit?.processTag || 'Uncategorized';
      } else key = meta?.region || 'Unassigned';

      const group = ensureGroup(key);
      group.totalSubmitted++;
      group.stores.add(submission.storeId);
      if (submission.status === 'completed') group.totalCompliant++;
    });

    return Object.values(groups)
      .map((g: any) => ({
        name: g.name,
        dimension: g.dimension,
        storeCount: g.stores.size,
        totalSubmitted: g.totalSubmitted,
        totalCompliant: g.totalCompliant,
        compliancePercentage:
          g.totalSubmitted > 0 ? Math.round((g.totalCompliant / g.totalSubmitted) * 100) : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
