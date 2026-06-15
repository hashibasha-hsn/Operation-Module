import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetTable)
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
