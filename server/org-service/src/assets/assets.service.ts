import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset, 'org')
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetTable, 'org')
    private assetTablesRepository: Repository<AssetTable>,
  ) {}

  // Asset methods
  async create(assetData: Partial<Asset>): Promise<Asset> {
    const asset = this.assetsRepository.create(assetData);
    return await this.assetsRepository.save(asset);
  }

  async findAll(organizationId: string): Promise<Asset[]> {
    return await this.assetsRepository.find({
      where: { organizationId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Asset> {
    return await this.assetsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, assetData: Partial<Asset>): Promise<Asset> {
    await this.assetsRepository.update(id, assetData);
    return await this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.assetsRepository.update(id, { isDeleted: true, deletedAt: new Date() });
  }

  async restore(id: string): Promise<void> {
    await this.assetsRepository.update(id, { isDeleted: false, deletedAt: null });
  }

  async findDeleted(organizationId: string): Promise<Asset[]> {
    return await this.assetsRepository.find({
      where: { organizationId, isDeleted: true },
      order: { deletedAt: 'DESC' },
    });
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
    const table = this.assetTablesRepository.create(tableData);
    return await this.assetTablesRepository.save(table);
  }

  async findAllTables(organizationId: string): Promise<AssetTable[]> {
    return await this.assetTablesRepository.find({
      where: { organizationId },
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

  async removeTable(id: string): Promise<void> {
    await this.assetTablesRepository.delete(id);
  }
}
