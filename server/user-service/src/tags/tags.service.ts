import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { AdvDropdownValue } from './adv-dropdown-value.entity';
import { AssigneeProfile } from './assignee-profile.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(AdvDropdownTag)
    private advDropdownTagRepository: Repository<AdvDropdownTag>,
    @InjectRepository(AdvDropdownValue)
    private advDropdownValueRepository: Repository<AdvDropdownValue>,
    @InjectRepository(AssigneeProfile)
    private assigneeProfileRepository: Repository<AssigneeProfile>,
  ) {}

  // Adv Dropdown Tag Methods
  async createAdvDropdownTag(tagData: Partial<AdvDropdownTag>): Promise<AdvDropdownTag> {
    const tag = this.advDropdownTagRepository.create(tagData);
    return await this.advDropdownTagRepository.save(tag);
  }

  async findAllAdvDropdownTags(organizationId: string): Promise<AdvDropdownTag[]> {
    return await this.advDropdownTagRepository.find({
      where: { organizationId },
      relations: ['values', 'values.assignees'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAdvDropdownTag(id: string): Promise<AdvDropdownTag> {
    return await this.advDropdownTagRepository.findOne({
      where: { id },
      relations: ['values', 'values.assignees'],
    });
  }

  async updateAdvDropdownTag(id: string, tagData: Partial<AdvDropdownTag>): Promise<AdvDropdownTag> {
    await this.advDropdownTagRepository.update(id, tagData);
    return await this.findOneAdvDropdownTag(id);
  }

  async removeAdvDropdownTag(id: string): Promise<void> {
    await this.advDropdownTagRepository.delete(id);
  }

  // Adv Dropdown Value Methods
  async createAdvDropdownValue(valueData: Partial<AdvDropdownValue>): Promise<AdvDropdownValue> {
    const value = this.advDropdownValueRepository.create(valueData);
    return await this.advDropdownValueRepository.save(value);
  }

  async updateAdvDropdownValue(id: string, valueData: Partial<AdvDropdownValue>): Promise<AdvDropdownValue> {
    await this.advDropdownValueRepository.update(id, valueData);
    return await this.advDropdownValueRepository.findOne({ where: { id } });
  }

  async removeAdvDropdownValue(id: string): Promise<void> {
    await this.advDropdownValueRepository.delete(id);
  }

  // Assignee Profile Methods
  async createAssigneeProfile(profileData: Partial<AssigneeProfile>): Promise<AssigneeProfile> {
    const profile = this.assigneeProfileRepository.create(profileData);
    return await this.assigneeProfileRepository.save(profile);
  }

  async findAllAssigneeProfiles(organizationId: string): Promise<AssigneeProfile[]> {
    return await this.assigneeProfileRepository.find({
      where: { organizationId },
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAssigneeProfile(id: string): Promise<AssigneeProfile> {
    return await this.assigneeProfileRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async updateAssigneeProfile(id: string, profileData: Partial<AssigneeProfile>): Promise<AssigneeProfile> {
    await this.assigneeProfileRepository.update(id, profileData);
    return await this.findOneAssigneeProfile(id);
  }

  async removeAssigneeProfile(id: string): Promise<void> {
    await this.assigneeProfileRepository.delete(id);
  }
}
