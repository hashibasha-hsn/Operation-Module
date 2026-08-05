import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';
import { AssetFilter } from './asset-filter.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset, 'org')
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetTable, 'org')
    private assetTablesRepository: Repository<AssetTable>,
    @InjectRepository(AssetFilter, 'org')
    private assetFiltersRepository: Repository<AssetFilter>,
  ) {}

  private recordHistory(asset: Asset, action: string, actor: string, note?: string) {
    const history = Array.isArray(asset.history) ? asset.history : [];
    history.push({
      action,
      user: actor || asset.updatedBy || asset.createdBy || '',
      date: new Date(),
      note: note || '',
    });
    return history;
  }

  private validateCustomFields(table: AssetTable, customFields: any, partial = false): string | null {
    if (!table?.customFields || !Array.isArray(table.customFields)) return null;
    const provided = customFields && typeof customFields === 'object' ? customFields : {};
    for (const field of table.customFields) {
      if (!field?.fieldName) continue;
      const value = provided[field.fieldName];
      const isMissing = value === undefined || value === null || value === '';
      if (field.isRequired && isMissing && !partial) {
        return `Missing required field: ${field.fieldName}`;
      }
      if (!isMissing) {
        switch (field.fieldType) {
          case 'number':
            if (Number.isNaN(Number(value))) return `${field.fieldName} must be a number`;
            break;
          case 'date':
            if (Number.isNaN(Date.parse(String(value)))) return `${field.fieldName} must be a valid date`;
            break;
          case 'dropdown':
            if (field.options?.length && !field.options.includes(String(value))) {
              return `${field.fieldName} has an invalid value`;
            }
            break;
        }
      }
    }
    return null;
  }

  // Asset methods
  async create(assetData: Partial<Asset>): Promise<Asset> {
    const asset = this.assetsRepository.create({
      ...assetData,
      status: assetData.status || 'active',
      history: [{ action: 'created', user: assetData.createdBy || '', date: new Date() }],
    });
    return await this.assetsRepository.save(asset);
  }

  async saveDraft(draftData: Partial<Asset>): Promise<Asset> {
    const data: any = {
      ...draftData,
      status: 'draft',
      isActive: draftData.isActive ?? true,
    };
    if (draftData.id) {
      await this.assetsRepository.update(draftData.id, data);
      return await this.findOne(draftData.id);
    }
    const asset = this.assetsRepository.create({
      ...data,
      history: [{ action: 'draft_created', user: draftData.createdBy || '', date: new Date() }],
    });
    return (await this.assetsRepository.save(asset)) as unknown as Asset;
  }

  async findAll(organizationId: string, query: any = {}): Promise<Asset[]> {
    const qb = this.assetsRepository
      .createQueryBuilder('asset')
      .where('asset.organizationId = :organizationId', { organizationId })
      .andWhere('asset.isDeleted = :isDeleted', { isDeleted: false });

    if (query.search) {
      qb.andWhere(
        '(asset.assetName ILIKE :search OR asset.customAssetId ILIKE :search OR asset.id::text ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.tableId) {
      qb.andWhere('asset.tableId = :tableId', { tableId: query.tableId });
    }
    if (query.status && query.status !== 'all') {
      qb.andWhere('asset.status = :status', { status: query.status });
    }
    if (query.condition && query.condition !== 'all') {
      qb.andWhere('asset.condition = :condition', { condition: query.condition });
    }
    if (query.storeId && query.storeId !== 'all') {
      qb.andWhere('asset.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.userId && query.userId !== 'all') {
      qb.andWhere('(asset.userId = :userId OR asset.ownerUserId = :userId)', { userId: query.userId });
    }
    if (query.expiryFrom) {
      qb.andWhere('asset.expiryDate >= :expiryFrom', { expiryFrom: new Date(query.expiryFrom) });
    }
    if (query.expiryTo) {
      qb.andWhere('asset.expiryDate <= :expiryTo', { expiryTo: new Date(query.expiryTo) });
    }

    const assets = await qb.orderBy('asset.createdAt', 'DESC').getMany();

    // Post-query custom-field filtering (customFields is a JSON column)
    if (query.customFields && Object.keys(query.customFields).length) {
      return assets.filter((a) => {
        const cf = a.customFields && typeof a.customFields === 'object' ? a.customFields : {};
        return Object.entries(query.customFields).every(([key, val]) => {
          if (!val) return true;
          const stored = cf[key];
          if (Array.isArray(stored)) return stored.includes(val);
          return String(stored ?? '') === String(val);
        });
      });
    }
    return assets;
  }

  async findOne(id: string): Promise<Asset> {
    return await this.assetsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, assetData: Partial<Asset>): Promise<Asset> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Asset ${id} not found`);
    if (assetData.tableId) {
      const table = await this.findOneTable(assetData.tableId);
      if (!table) throw new NotFoundException(`Asset table ${assetData.tableId} not found`);
      const error = this.validateCustomFields(table, assetData.customFields ?? existing.customFields);
      if (error) throw new BadRequestException(error);
    }
    const history = this.recordHistory(existing, 'updated', assetData.updatedBy || '', 'Asset updated');
    await this.assetsRepository.update(id, { ...assetData, history });
    return await this.findOne(id);
  }

  async softDelete(id: string, actor?: string): Promise<void> {
    const existing = await this.findOne(id);
    if (existing) {
      const history = this.recordHistory(existing, 'deleted', actor || '', 'Asset deleted');
      await this.assetsRepository.update(id, { isDeleted: true, deletedAt: new Date(), history });
    } else {
      await this.assetsRepository.update(id, { isDeleted: true, deletedAt: new Date() });
    }
  }

  async restore(id: string, actor?: string): Promise<void> {
    const existing = await this.findOne(id);
    if (existing) {
      const history = this.recordHistory(existing, 'restored', actor || '', 'Asset restored');
      await this.assetsRepository.update(id, { isDeleted: false, deletedAt: null, history });
    } else {
      await this.assetsRepository.update(id, { isDeleted: false, deletedAt: null });
    }
  }

  async findDeleted(organizationId: string): Promise<Asset[]> {
    return await this.assetsRepository.find({
      where: { organizationId, isDeleted: true },
      order: { deletedAt: 'DESC' },
    });
  }

  async transferOwnership(id: string, newOwnerId: string, actor?: string): Promise<Asset> {
    if (!newOwnerId) throw new BadRequestException('New owner is required');
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Asset ${id} not found`);
    const previousOwners = Array.isArray(existing.previousOwners) ? existing.previousOwners : [];
    if (existing.ownerUserId || existing.userId) {
      previousOwners.push({
        userId: existing.ownerUserId || existing.userId,
        transferredFrom: existing.updatedAt || new Date(),
      });
    }
    const history = this.recordHistory(existing, 'transferred', actor || '', `Ownership transferred to ${newOwnerId}`);
    await this.assetsRepository.update(id, {
      ownerUserId: newOwnerId,
      userId: newOwnerId,
      previousOwners,
      history,
      updatedBy: actor || existing.updatedBy,
    });
    return await this.findOne(id);
  }

  async updateStatus(id: string, status: string, actor?: string): Promise<Asset> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(`Asset ${id} not found`);
    const history = this.recordHistory(existing, `status_${status}`, actor || '', `Status changed to ${status}`);
    await this.assetsRepository.update(id, { status, history, updatedBy: actor || existing.updatedBy });
    return await this.findOne(id);
  }

  async bulkUpload(organizationId: string, rows: any[], createdBy?: string): Promise<any> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('No asset rows provided');
    }
    const succeeded: Asset[] = [];
    const failed: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const assetName = row.assetName || row.AssetName || row.name;
        if (!assetName) throw new Error('Missing assetName');
        const asset = this.assetsRepository.create({
          assetName: String(assetName),
          customAssetId: row.customAssetId || row.CustomAssetId || row.assetId || undefined,
          tableId: row.tableId || undefined,
          storeId: row.storeId || row.StoreId || undefined,
          userId: row.userId || row.UserId || row.ownerUserId || undefined,
          status: row.status || 'active',
          condition: row.condition || 'good',
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
          renewalDate: row.renewalDate ? new Date(row.renewalDate) : undefined,
          utilizationPercent: row.utilizationPercent ? Number(row.utilizationPercent) : 0,
          customFields: row.customFields || undefined,
          organizationId,
          createdBy: createdBy || '',
          history: [{ action: 'bulk_import', user: createdBy || '', date: new Date() }],
        });
        const saved = await this.assetsRepository.save(asset);
        succeeded.push(saved);
      } catch (err: any) {
        failed.push({
          row: i + 2,
          assetName: row.assetName || row.AssetName || row.name || '',
          message: err?.message || 'Failed to import row',
        });
      }
    }
    return {
      total: rows.length,
      succeeded: succeeded.length,
      failed: failed.length,
      errors: failed,
      assets: succeeded,
    };
  }

  // Filter preset methods
  async createFilter(filterData: Partial<AssetFilter>): Promise<AssetFilter> {
    const filter = this.assetFiltersRepository.create(filterData);
    return await this.assetFiltersRepository.save(filter);
  }

  async findFilters(organizationId: string, userId?: string): Promise<AssetFilter[]> {
    const where: any = { organizationId };
    if (userId) {
      return await this.assetFiltersRepository.find({
        where: [{ organizationId, createdBy: userId }, { organizationId, visibility: 'shared' }],
        order: { createdAt: 'DESC' },
      });
    }
    return await this.assetFiltersRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateFilter(id: string, filterData: Partial<AssetFilter>): Promise<AssetFilter> {
    await this.assetFiltersRepository.update(id, filterData);
    return await this.assetFiltersRepository.findOne({ where: { id } });
  }

  async removeFilter(id: string): Promise<void> {
    await this.assetFiltersRepository.delete(id);
  }

  async getAssetOrgReport(organizationId: string, filters: any = {}): Promise<any> {
    const query = this.assetsRepository
      .createQueryBuilder('asset')
      .where('asset.organizationId = :organizationId', { organizationId });

    // Default: exclude soft-deleted unless status filter asks for disposed/deleted
    const includeDeleted =
      filters.status === 'disposed' ||
      filters.status === 'deleted' ||
      filters.includeDeleted === 'true' ||
      filters.includeDeleted === true;
    if (!includeDeleted) {
      query.andWhere('asset.isDeleted = :isDeleted', { isDeleted: false });
    }

    if (filters.startDate) {
      query.andWhere('asset.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('asset.createdAt <= :endDate', { endDate: end });
    }
    if (filters.storeId && filters.storeId !== 'all') {
      query.andWhere('asset.storeId = :storeId', { storeId: filters.storeId });
    }
    if (filters.userId && filters.userId !== 'all') {
      query.andWhere('asset.userId = :userId', { userId: filters.userId });
    }
    if (filters.condition && filters.condition !== 'all') {
      query.andWhere('asset.condition = :condition', { condition: filters.condition });
    }
    if (filters.search) {
      query.andWhere(
        '(asset.assetName ILIKE :search OR asset.customAssetId ILIKE :search OR asset.userId ILIKE :search OR asset.id::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    let assets = await query.orderBy('asset.createdAt', 'DESC').getMany();

    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const resolveStatus = (a: Asset) => {
      if (a.isDeleted) return 'disposed';
      if (a.status) return a.status;
      return a.isActive ? 'active' : 'inactive';
    };

    const isExpired = (a: Asset) => Boolean(a.expiryDate) && new Date(a.expiryDate) < now;
    const isExpiringSoon = (a: Asset) => {
      if (!a.expiryDate) return false;
      const d = new Date(a.expiryDate);
      return d >= now && d <= in30;
    };
    const needsRenewal = (a: Asset) => {
      if (!a.renewalDate) return false;
      return new Date(a.renewalDate) <= in30;
    };
    const isOverdueRenewal = (a: Asset) =>
      Boolean(a.renewalDate) && new Date(a.renewalDate) < now;

    // DB status filter (computed statuses applied after enrich)
    const computed = new Set([
      'expired',
      'expiringSoon',
      'needsRenewal',
      'overdueRenewal',
      'highUtilization',
      'lowUtilization',
    ]);
    if (filters.status && filters.status !== 'all' && !computed.has(filters.status)) {
      assets = assets.filter((a) => resolveStatus(a) === filters.status);
    }

    const enriched = assets.map((a) => {
      const status = resolveStatus(a);
      const expired = isExpired(a);
      const expiringSoon = isExpiringSoon(a);
      const renewalNeeded = needsRenewal(a);
      const overdueRenewal = isOverdueRenewal(a);
      const utilization = typeof a.utilizationPercent === 'number' ? a.utilizationPercent : 0;
      const history = Array.isArray(a.history) ? a.history : [];
      const daysToExpiry = a.expiryDate
        ? Math.ceil((new Date(a.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const daysToRenewal = a.renewalDate
        ? Math.ceil((new Date(a.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...a,
        status,
        condition: a.condition || 'good',
        utilizationPercent: utilization,
        isExpired: expired,
        isExpiringSoon: expiringSoon,
        needsRenewal: renewalNeeded,
        isOverdueRenewal: overdueRenewal,
        daysToExpiry,
        daysToRenewal,
        history,
        historyCount: history.length,
      };
    });

    let filtered = enriched;
    if (filters.status === 'expired') filtered = enriched.filter((a) => a.isExpired);
    else if (filters.status === 'expiringSoon') filtered = enriched.filter((a) => a.isExpiringSoon);
    else if (filters.status === 'needsRenewal') filtered = enriched.filter((a) => a.needsRenewal);
    else if (filters.status === 'overdueRenewal') filtered = enriched.filter((a) => a.isOverdueRenewal);
    else if (filters.status === 'highUtilization')
      filtered = enriched.filter((a) => a.utilizationPercent >= 80);
    else if (filters.status === 'lowUtilization')
      filtered = enriched.filter((a) => a.utilizationPercent > 0 && a.utilizationPercent < 40);

    const total = filtered.length;
    const active = filtered.filter((a) => a.status === 'active').length;
    const inactive = filtered.filter((a) => a.status === 'inactive').length;
    const maintenance = filtered.filter((a) => a.status === 'maintenance').length;
    const retired = filtered.filter((a) => a.status === 'retired').length;
    const disposed = filtered.filter((a) => a.status === 'disposed').length;
    const expired = filtered.filter((a) => a.isExpired).length;
    const expiringSoon = filtered.filter((a) => a.isExpiringSoon).length;
    const needsRenewalCount = filtered.filter((a) => a.needsRenewal).length;
    const overdueRenewal = filtered.filter((a) => a.isOverdueRenewal).length;
    const assigned = filtered.filter((a) => Boolean(a.userId)).length;
    const unassigned = total - assigned;

    const utilValues = filtered.map((a) => a.utilizationPercent);
    const avgUtilization =
      utilValues.length > 0
        ? Math.round(utilValues.reduce((s, v) => s + v, 0) / utilValues.length)
        : 0;
    const highUtilization = filtered.filter((a) => a.utilizationPercent >= 80).length;
    const lowUtilization = filtered.filter(
      (a) => a.utilizationPercent > 0 && a.utilizationPercent < 40,
    ).length;

    const byStatus = ['active', 'inactive', 'maintenance', 'retired', 'disposed'].map((s) => ({
      status: s,
      count: filtered.filter((a) => a.status === s).length,
    }));

    const byCondition = ['excellent', 'good', 'fair', 'poor'].map((c) => ({
      condition: c,
      count: filtered.filter((a) => (a.condition || 'good') === c).length,
    }));

    const byStoreMap: Record<string, any> = {};
    filtered.forEach((a) => {
      const key = a.storeId || 'Unassigned Store';
      if (!byStoreMap[key]) {
        byStoreMap[key] = {
          storeId: key,
          total: 0,
          active: 0,
          expired: 0,
          utilizationSum: 0,
        };
      }
      const row = byStoreMap[key];
      row.total++;
      if (a.status === 'active') row.active++;
      if (a.isExpired) row.expired++;
      row.utilizationSum += a.utilizationPercent;
    });
    const byStore = Object.values(byStoreMap)
      .map((row: any) => ({
        storeId: row.storeId,
        total: row.total,
        active: row.active,
        expired: row.expired,
        avgUtilization: row.total > 0 ? Math.round(row.utilizationSum / row.total) : 0,
      }))
      .sort((a: any, b: any) => b.total - a.total);

    const utilizationBuckets = [
      { bucket: '0%', count: 0 },
      { bucket: '1-39%', count: 0 },
      { bucket: '40-79%', count: 0 },
      { bucket: '80-100%', count: 0 },
    ];
    filtered.forEach((a) => {
      const u = a.utilizationPercent;
      if (u <= 0) utilizationBuckets[0].count++;
      else if (u < 40) utilizationBuckets[1].count++;
      else if (u < 80) utilizationBuckets[2].count++;
      else utilizationBuckets[3].count++;
    });

    // Flatten history events for history reporting
    const historyEvents: any[] = [];
    filtered.forEach((a) => {
      (a.history || []).forEach((h: any) => {
        historyEvents.push({
          assetId: a.id,
          assetName: a.assetName,
          customAssetId: a.customAssetId,
          storeId: a.storeId,
          date: h.date || h.at || h.createdAt || null,
          action: h.action || h.type || 'update',
          note: h.note || h.description || '',
          user: h.user || h.by || h.userId || '',
        });
      });
    });
    historyEvents.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    const trendMap: Record<string, { date: string; created: number; expired: number; renewed: number }> = {};
    filtered.forEach((a) => {
      const createdKey = new Date(a.createdAt).toISOString().slice(0, 10);
      if (!trendMap[createdKey]) {
        trendMap[createdKey] = { date: createdKey, created: 0, expired: 0, renewed: 0 };
      }
      trendMap[createdKey].created++;
      if (a.isExpired) trendMap[createdKey].expired++;
      (a.history || []).forEach((h: any) => {
        const action = String(h.action || h.type || '').toLowerCase();
        if (action.includes('renew') && (h.date || h.at)) {
          const key = new Date(h.date || h.at).toISOString().slice(0, 10);
          if (!trendMap[key]) trendMap[key] = { date: key, created: 0, expired: 0, renewed: 0 };
          trendMap[key].renewed++;
        }
      });
    });
    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    const expiringList = filtered
      .filter((a) => a.isExpired || a.isExpiringSoon || a.needsRenewal || a.isOverdueRenewal)
      .sort((a, b) => {
        const da = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      });

    return {
      assets: filtered,
      statusCounts: {
        total,
        active,
        inactive,
        maintenance,
        retired,
        disposed,
        expired,
        expiringSoon,
        needsRenewal: needsRenewalCount,
        overdueRenewal,
        highUtilization,
        lowUtilization,
      },
      kpis: {
        total,
        active,
        expired,
        expiringSoon,
        needsRenewal: needsRenewalCount,
        overdueRenewal,
        avgUtilization,
        assigned,
        unassigned,
        utilizationRate: avgUtilization,
        assignmentRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      },
      byStatus,
      byCondition,
      byStore,
      utilizationBuckets,
      historyEvents,
      expiringList,
      trends,
    };
  }

  // Asset Table methods
  async createTable(tableData: Partial<AssetTable>): Promise<AssetTable> {
    if (!tableData.tableName?.trim()) {
      throw new BadRequestException('Table name is required');
    }
    const table = this.assetTablesRepository.create({
      ...tableData,
      tableName: tableData.tableName.trim(),
      publishStatus: tableData.publishStatus || 'draft',
      customFields: tableData.customFields ?? [],
      assignmentType: tableData.assignmentType || 'global',
    });
    return await this.assetTablesRepository.save(table);
  }

  async findAllTables(organizationId: string): Promise<AssetTable[]> {
    return await this.assetTablesRepository.find({
      where: { organizationId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTable(id: string): Promise<AssetTable> {
    return await this.assetTablesRepository.findOne({
      where: { id },
    });
  }

  async updateTable(id: string, tableData: Partial<AssetTable>): Promise<AssetTable> {
    await this.assetTablesRepository.update(id, tableData);
    return await this.findOneTable(id);
  }

  async publishTable(id: string): Promise<AssetTable> {
    const table = await this.findOneTable(id);
    if (!table) throw new NotFoundException(`Asset table ${id} not found`);
    await this.assetTablesRepository.update(id, { publishStatus: 'published' });
    return await this.findOneTable(id);
  }

  async archiveTable(id: string): Promise<AssetTable> {
    const table = await this.findOneTable(id);
    if (!table) throw new NotFoundException(`Asset table ${id} not found`);
    await this.assetTablesRepository.update(id, { publishStatus: 'archived' });
    return await this.findOneTable(id);
  }

  async removeTable(id: string): Promise<void> {
    await this.assetTablesRepository.update(id, { isDeleted: true, deletedAt: new Date() });
  }
}
