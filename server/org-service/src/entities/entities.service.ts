import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { BusinessEntity } from './entity.entity';
import { RemovedEntity } from './removed-entity.entity';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(BusinessEntity, 'org')
    private entitiesRepository: Repository<BusinessEntity>,
    @InjectRepository(RemovedEntity, 'org')
    private removedEntitiesRepository: Repository<RemovedEntity>,
  ) {}

  private async assertEntityIdAvailable(entityId: string, excludeId?: string) {
    const trimmed = entityId?.trim();
    if (!trimmed) return;

    const existing = await this.findByEntityId(trimmed);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Entity ID "${trimmed}" already exists`);
    }
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const message = String(error.message || '');
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        throw new ConflictException('An entity with this Entity ID already exists');
      }
    }
    throw error;
  }

  async create(entityData: Partial<BusinessEntity>): Promise<BusinessEntity> {
    if (entityData.entityId) {
      await this.assertEntityIdAvailable(entityData.entityId);
    }

    try {
      const entity = this.entitiesRepository.create(entityData);
      return await this.entitiesRepository.save(entity);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findAll(organizationId: string, search?: string): Promise<BusinessEntity[]> {
    const term = search?.trim();
    if (!term) {
      return this.entitiesRepository.find({
        where: { organizationId },
        order: { createdAt: 'DESC' },
      });
    }

    return this.entitiesRepository
      .createQueryBuilder('entity')
      .where('entity.organizationId = :organizationId', { organizationId })
      .andWhere(
        `(entity.storeName ILIKE :term OR entity.entityId ILIKE :term OR entity.area ILIKE :term OR entity.city ILIKE :term)`,
        { term: `%${term}%` },
      )
      .orderBy('entity.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<BusinessEntity> {
    return await this.entitiesRepository.findOne({ where: { id } });
  }

  async findByEntityId(entityId: string): Promise<BusinessEntity> {
    return await this.entitiesRepository.findOne({ where: { entityId } });
  }

  async findByStoreStatus(storeStatus: string, organizationId: string): Promise<BusinessEntity[]> {
    return await this.entitiesRepository.find({
      where: { storeStatus, organizationId },
    });
  }

  async bulkCreate(
    rows: Partial<BusinessEntity>[],
    organizationId: string,
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    if (!rows.length) {
      throw new BadRequestException('No valid rows found in the uploaded file');
    }

    const created: BusinessEntity[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // offset for header row (1-based)
      const storeName = String(row.storeName || '').trim();

      if (!storeName) {
        errors.push(`Row ${rowNum}: store name is required`);
        continue;
      }

      if (row.entityId) {
        const trimmed = String(row.entityId).trim();
        const existing = await this.findByEntityId(trimmed);
        if (existing) {
          errors.push(`Row ${rowNum}: Entity ID "${trimmed}" already exists`);
          continue;
        }
      }

      try {
        const entity = this.entitiesRepository.create({
          ...row,
          storeName,
          entityId: row.entityId ? String(row.entityId).trim() : undefined,
          area: row.area ? String(row.area).trim() : undefined,
          city: row.city ? String(row.city).trim() : undefined,
          region: row.region ? String(row.region).trim() : undefined,
          storeStatus: row.storeStatus ? String(row.storeStatus).trim() : 'Functional',
          organizationId,
        });
        created.push(await this.entitiesRepository.save(entity));
      } catch (error) {
        if (error instanceof QueryFailedError) {
          const message = String(error.message || '');
          if (message.includes('duplicate key') || message.includes('unique constraint')) {
            errors.push(`Row ${rowNum}: Entity ID already exists`);
            continue;
          }
        }
        throw error;
      }
    }

    return { created: created.length, failed: errors.length, errors };
  }

  async update(id: string, entityData: Partial<BusinessEntity>): Promise<BusinessEntity> {
    if (entityData.entityId) {
      await this.assertEntityIdAvailable(entityData.entityId, id);
    }

    try {
      await this.entitiesRepository.update(id, entityData);
      return await this.findOne(id);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    if (entity) {
      const removedEntity = this.removedEntitiesRepository.create({
        id: entity.id,
        storeName: entity.storeName,
        area: entity.area,
        entityId: entity.entityId,
        storeStatus: entity.storeStatus,
        city: entity.city,
        region: entity.region,
        regionId: entity.regionId,
        cityId: entity.cityId,
        districtId: entity.districtId,
        staff: entity.staff,
        status: entity.status,
        latitude: entity.latitude,
        longitude: entity.longitude,
        storeRadius: entity.storeRadius,
        organizationId: entity.organizationId,
        tags: entity.tags,
        registrationName: entity.registrationName,
        companyId: entity.companyId,
        taxSchemeId: entity.taxSchemeId,
        businessCategory: entity.businessCategory,
        businessIdentificationId: entity.businessIdentificationId,
        identificationScheme: entity.identificationScheme,
        streetName: entity.streetName,
        districtName: entity.districtName,
        cityName: entity.cityName,
        buildingNumber: entity.buildingNumber,
        postalZone: entity.postalZone,
        countryIdentificationCode: entity.countryIdentificationCode,
        csrIndustryBusinessCategory: entity.csrIndustryBusinessCategory,
        csrCommonName: entity.csrCommonName,
        csrSerialNumber: entity.csrSerialNumber,
        csrOrganizationIdentifier: entity.csrOrganizationIdentifier,
        csrOrganizationUnitName: entity.csrOrganizationUnitName,
        csrOrganizationName: entity.csrOrganizationName,
        csrCountryName: entity.csrCountryName,
        csrInvoiceType: entity.csrInvoiceType,
        csrLocationAddress: entity.csrLocationAddress,
        csrEnvironmentType: entity.csrEnvironmentType,
        generatedCsr: entity.generatedCsr,
        generatedPrivateKey: entity.generatedPrivateKey,
        ccsidOtp: entity.ccsidOtp,
        ccsidBinaryToken: entity.ccsidBinaryToken,
        tokenSecret: entity.tokenSecret,
        requestId: entity.requestId,
        pcsidBinaryToken: entity.pcsidBinaryToken,
        pcsidSecret: entity.pcsidSecret,
        registeredDate: entity.registeredDate,
        originalCreatedAt: entity.createdAt,
      });
      await this.removedEntitiesRepository.save(removedEntity);
      await this.entitiesRepository.delete(id);
    }
  }
}
