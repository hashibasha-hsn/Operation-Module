import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTag } from './user-tag.entity';

@Injectable()
export class UserTagsService {
  constructor(
    @InjectRepository(UserTag)
    private readonly userTagRepository: Repository<UserTag>,
  ) {}

  async findAll(organizationId: string) {
    return await this.userTagRepository.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return await this.userTagRepository.findOne({ where: { id } });
  }

  async create(createUserTagDto: any) {
    const userTag = this.userTagRepository.create(createUserTagDto);
    return await this.userTagRepository.save(userTag);
  }

  async update(id: string, updateUserTagDto: any) {
    await this.userTagRepository.update(id, updateUserTagDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.userTagRepository.delete(id);
    return { message: 'User tag deleted successfully' };
  }
}
