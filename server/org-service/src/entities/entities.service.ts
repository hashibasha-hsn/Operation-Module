import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from './entity.entity';
import { RemovedEntity } from './removed-entity.entity';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(BusinessEntity)
    private entitiesRepository: Repository<BusinessEntity>,
    @InjectRepository(RemovedEntity)
    private removedEntitiesRepository: Repository<RemovedEntity>,
  ) {}

  async create(entityData: Partial<BusinessEntity>): Promise<BusinessEntity> {
    const entity = this.entitiesRepository.create(entityData);
    return await this.entitiesRepository.save(entity);
  }

  async findAll(organizationId: string): Promise<BusinessEntity[]> {
    return await this.entitiesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
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

  async update(id: string, entityData: Partial<BusinessEntity>): Promise<BusinessEntity> {
    await this.entitiesRepository.update(id, entityData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    if (entity) {
      // Move to removed entities table
      const removedEntity = this.removedEntitiesRepository.create({
        id: entity.id,
        storeName: entity.storeName,
        area: entity.area,
        entityId: entity.entityId,
        storeStatus: entity.storeStatus,
        city: entity.city,
        staff: entity.staff,
        latitude: entity.latitude,
        longitude: entity.longitude,
        storeRadius: entity.storeRadius,
        organizationId: entity.organizationId,
        tags: entity.tags,
        originalCreatedAt: entity.createdAt,
      });
      await this.removedEntitiesRepository.save(removedEntity);
      // Delete from main entities table
      await this.entitiesRepository.delete(id);
    }
  }
}
