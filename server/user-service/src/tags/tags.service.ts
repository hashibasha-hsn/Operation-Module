import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { AdvDropdownValue } from './adv-dropdown-value.entity';
import { AssigneeProfile } from './assignee-profile.entity';
import { UserProfile } from '../profiles/user-profile.entity';
import { ProcessTag } from './process-tag.entity';
import { QuestionTag } from './question-tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(AdvDropdownTag)
    private advDropdownTagRepository: Repository<AdvDropdownTag>,
    @InjectRepository(AdvDropdownValue)
    private advDropdownValueRepository: Repository<AdvDropdownValue>,
    @InjectRepository(AssigneeProfile)
    private assigneeProfileRepository: Repository<AssigneeProfile>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(ProcessTag)
    private processTagRepository: Repository<ProcessTag>,
    @InjectRepository(QuestionTag)
    private questionTagRepository: Repository<QuestionTag>,
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
  private async resolveProfileUsers(userIds?: string[]): Promise<UserProfile[]> {
    if (!userIds?.length) {
      return [];
    }
    return this.userProfileRepository.find({
      where: { id: In(userIds) },
    });
  }

  async createAssigneeProfile(
    profileData: Partial<AssigneeProfile & { userIds?: string[] }>,
  ): Promise<AssigneeProfile> {
    const { userIds, users: _users, ...restProfileData } = profileData;
    const users = await this.resolveProfileUsers(userIds);

    const profile = this.assigneeProfileRepository.create({
      ...restProfileData,
      users,
    });
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
    const profile = await this.assigneeProfileRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!profile) {
      throw new NotFoundException(`Assignee profile ${id} not found`);
    }
    return profile;
  }

  async updateAssigneeProfile(
    id: string,
    profileData: Partial<AssigneeProfile & { userIds?: string[] }>,
  ): Promise<AssigneeProfile> {
    const profile = await this.findOneAssigneeProfile(id);
    const { userIds, users: _users, ...restProfileData } = profileData;

    Object.assign(profile, restProfileData);

    if (userIds !== undefined) {
      profile.users = await this.resolveProfileUsers(userIds);
    }

    return await this.assigneeProfileRepository.save(profile);
  }

  async removeAssigneeProfile(id: string): Promise<void> {
    await this.assigneeProfileRepository.delete(id);
  }

  // Process Tag Methods
  async createProcessTag(tagData: Partial<ProcessTag>): Promise<ProcessTag> {
    const tag = this.processTagRepository.create(tagData);
    return await this.processTagRepository.save(tag);
  }

  async findAllProcessTags(organizationId: string): Promise<ProcessTag[]> {
    return await this.processTagRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneProcessTag(id: string): Promise<ProcessTag> {
    return await this.processTagRepository.findOne({ where: { id } });
  }

  async updateProcessTag(id: string, tagData: Partial<ProcessTag>): Promise<ProcessTag> {
    await this.processTagRepository.update(id, tagData);
    return await this.findOneProcessTag(id);
  }

  async removeProcessTag(id: string): Promise<void> {
    await this.processTagRepository.delete(id);
  }

  // Question Tag Methods
  async createQuestionTag(tagData: Partial<QuestionTag>): Promise<QuestionTag> {
    const tag = this.questionTagRepository.create(tagData);
    return await this.questionTagRepository.save(tag);
  }

  async findAllQuestionTags(organizationId: string): Promise<QuestionTag[]> {
    return await this.questionTagRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneQuestionTag(id: string): Promise<QuestionTag> {
    return await this.questionTagRepository.findOne({ where: { id } });
  }

  async updateQuestionTag(id: string, tagData: Partial<QuestionTag>): Promise<QuestionTag> {
    await this.questionTagRepository.update(id, tagData);
    return await this.findOneQuestionTag(id);
  }

  async removeQuestionTag(id: string): Promise<void> {
    await this.questionTagRepository.delete(id);
  }
}
