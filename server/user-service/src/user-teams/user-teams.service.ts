import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTeam } from './user-team.entity';

@Injectable()
export class UserTeamsService {
  constructor(
    @InjectRepository(UserTeam)
    private readonly userTeamRepository: Repository<UserTeam>,
  ) {}

  async findAll(organizationId: string) {
    return await this.userTeamRepository.find({
      where: { organizationId, isActive: true },
      relations: ['members'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return await this.userTeamRepository.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async create(createUserTeamDto: any) {
    const userTeam = this.userTeamRepository.create(createUserTeamDto);
    return await this.userTeamRepository.save(userTeam);
  }

  async update(id: string, updateUserTeamDto: any) {
    await this.userTeamRepository.update(id, updateUserTeamDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.userTeamRepository.delete(id);
    return { message: 'User team deleted successfully' };
  }

  async addMember(teamId: string, userId: string) {
    const team = await this.findOne(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    // Add member logic would go here
    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string) {
    const team = await this.findOne(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    // Remove member logic would go here
    return this.findOne(teamId);
  }
}
