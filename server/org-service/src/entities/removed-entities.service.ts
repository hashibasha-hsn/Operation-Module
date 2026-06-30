import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemovedEntity } from './removed-entity.entity';
import { BusinessEntity } from './entity.entity';

@Injectable()
export class RemovedEntitiesService {
  constructor(
    @InjectRepository(RemovedEntity)
    private removedEntitiesRepository: Repository<RemovedEntity>,
    @InjectRepository(BusinessEntity)
    private entitiesRepository: Repository<BusinessEntity>,
  ) {}

  async create(entityData: Partial<RemovedEntity>): Promise<RemovedEntity> {
    const removedEntity = this.removedEntitiesRepository.create(entityData);
    return await this.removedEntitiesRepository.save(removedEntity);
  }

  async findAll(organizationId: string): Promise<RemovedEntity[]> {
    return await this.removedEntitiesRepository.find({
      where: { organizationId },
      order: { removedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<RemovedEntity> {
    return await this.removedEntitiesRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.removedEntitiesRepository.delete(id);
  }

  async restore(id: string): Promise<void> {
    const removedEntity = await this.findOne(id);
    if (removedEntity) {
      // Recreate entity in main entities table
      const entity = this.entitiesRepository.create({
        id: removedEntity.id,
        storeName: removedEntity.storeName,
        area: removedEntity.area,
        entityId: removedEntity.entityId,
        storeStatus: removedEntity.storeStatus,
        city: removedEntity.city,
        staff: removedEntity.staff,
        status: removedEntity.status,
        latitude: removedEntity.latitude,
        longitude: removedEntity.longitude,
        storeRadius: removedEntity.storeRadius,
        organizationId: removedEntity.organizationId,
        tags: removedEntity.tags,
        registrationName: removedEntity.registrationName,
        companyId: removedEntity.companyId,
        taxSchemeId: removedEntity.taxSchemeId,
        businessCategory: removedEntity.businessCategory,
        businessIdentificationId: removedEntity.businessIdentificationId,
        identificationScheme: removedEntity.identificationScheme,
        streetName: removedEntity.streetName,
        districtName: removedEntity.districtName,
        cityName: removedEntity.cityName,
        buildingNumber: removedEntity.buildingNumber,
        postalZone: removedEntity.postalZone,
        countryIdentificationCode: removedEntity.countryIdentificationCode,
        csrIndustryBusinessCategory: removedEntity.csrIndustryBusinessCategory,
        csrCommonName: removedEntity.csrCommonName,
        csrSerialNumber: removedEntity.csrSerialNumber,
        csrOrganizationIdentifier: removedEntity.csrOrganizationIdentifier,
        csrOrganizationUnitName: removedEntity.csrOrganizationUnitName,
        csrOrganizationName: removedEntity.csrOrganizationName,
        csrCountryName: removedEntity.csrCountryName,
        csrInvoiceType: removedEntity.csrInvoiceType,
        csrLocationAddress: removedEntity.csrLocationAddress,
        csrEnvironmentType: removedEntity.csrEnvironmentType,
        generatedCsr: removedEntity.generatedCsr,
        generatedPrivateKey: removedEntity.generatedPrivateKey,
        ccsidOtp: removedEntity.ccsidOtp,
        ccsidBinaryToken: removedEntity.ccsidBinaryToken,
        tokenSecret: removedEntity.tokenSecret,
        requestId: removedEntity.requestId,
        pcsidBinaryToken: removedEntity.pcsidBinaryToken,
        pcsidSecret: removedEntity.pcsidSecret,
        registeredDate: removedEntity.registeredDate,
        createdAt: removedEntity.originalCreatedAt,
      });
      await this.entitiesRepository.save(entity);
      // Delete from removed entities table
      await this.removedEntitiesRepository.delete(id);
    }
  }
}
