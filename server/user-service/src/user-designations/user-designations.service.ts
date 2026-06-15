import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDesignation } from './user-designation.entity';

@Injectable()
export class UserDesignationsService {
  constructor(
    @InjectRepository(UserDesignation)
    private userDesignationsRepository: Repository<UserDesignation>,
  ) {}

  async create(assignmentData: Partial<UserDesignation>): Promise<UserDesignation> {
    const assignment = this.userDesignationsRepository.create(assignmentData);
    return await this.userDesignationsRepository.save(assignment);
  }

  async findAll(organizationId: string): Promise<UserDesignation[]> {
    return await this.userDesignationsRepository.find({
      where: { organizationId },
      relations: ['designation'],
    });
  }

  async findOne(id: string): Promise<UserDesignation> {
    return await this.userDesignationsRepository.findOne({
      where: { id },
      relations: ['designation'],
    });
  }

  async findByUser(userId: string): Promise<UserDesignation[]> {
    return await this.userDesignationsRepository.find({
      where: { userId },
      relations: ['designation'],
    });
  }

  async findPrimaryByUser(userId: string, organizationId: string): Promise<UserDesignation> {
    return await this.userDesignationsRepository.findOne({
      where: { userId, organizationId, isPrimary: true },
      relations: ['designation'],
    });
  }

  async update(id: string, assignmentData: Partial<UserDesignation>): Promise<UserDesignation> {
    await this.userDesignationsRepository.update(id, assignmentData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userDesignationsRepository.delete(id);
  }

  async setPrimary(userId: string, organizationId: string, designationId: string): Promise<UserDesignation> {
    // First, remove primary status from all existing assignments
    await this.userDesignationsRepository.update(
      { userId, organizationId },
      { isPrimary: false }
    );
    
    // Then set the new primary
    const assignment = await this.userDesignationsRepository.findOne({
      where: { userId, organizationId, designationId },
    });
    
    if (assignment) {
      await this.userDesignationsRepository.update(assignment.id, { isPrimary: true });
      return await this.findOne(assignment.id);
    }
    
    // If assignment doesn't exist, create it
    return await this.create({
      userId,
      organizationId,
      designationId,
      isPrimary: true,
    });
  }
}
