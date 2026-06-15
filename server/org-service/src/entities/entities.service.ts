import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from './entity.entity';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(BusinessEntity)
    private entitiesRepository: Repository<BusinessEntity>,
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
    await this.entitiesRepository.delete(id);
  }

  async updateStatus(id: string, status: boolean): Promise<BusinessEntity> {
    await this.entitiesRepository.update(id, { status });
    return await this.findOne(id);
  }
}
