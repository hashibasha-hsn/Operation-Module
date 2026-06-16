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
        latitude: removedEntity.latitude,
        longitude: removedEntity.longitude,
        storeRadius: removedEntity.storeRadius,
        organizationId: removedEntity.organizationId,
        tags: removedEntity.tags,
        createdAt: removedEntity.originalCreatedAt,
      });
      await this.entitiesRepository.save(entity);
      // Delete from removed entities table
      await this.removedEntitiesRepository.delete(id);
    }
  }
}
