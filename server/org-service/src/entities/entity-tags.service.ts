import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityTag } from './entity-tag.entity';

@Injectable()
export class EntityTagsService {
  constructor(
    @InjectRepository(EntityTag)
    private entityTagsRepository: Repository<EntityTag>,
  ) {}

  async create(tagData: Partial<EntityTag>): Promise<EntityTag> {
    const entityTag = this.entityTagsRepository.create(tagData);
    return await this.entityTagsRepository.save(entityTag);
  }

  async findAll(organizationId: string): Promise<EntityTag[]> {
    return await this.entityTagsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<EntityTag> {
    return await this.entityTagsRepository.findOne({ where: { id } });
  }

  async update(id: number, tagData: Partial<EntityTag>): Promise<EntityTag> {
    await this.entityTagsRepository.update(id, tagData);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.entityTagsRepository.delete(id);
  }
}
