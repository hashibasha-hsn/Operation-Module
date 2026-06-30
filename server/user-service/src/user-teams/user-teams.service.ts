import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserTeam } from './user-team.entity';
import { TeamMember } from './team-member.entity';
import { UserProfile } from '../profiles/user-profile.entity';

@Injectable()
export class UserTeamsService {
  constructor(
    @InjectRepository(UserTeam)
    private readonly userTeamRepository: Repository<UserTeam>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  private async getMemberIds(teamId: string): Promise<string[]> {
    const rows = await this.teamMemberRepository.find({ where: { teamId } });
    return rows.map((row) => row.userId);
  }

  private async syncMembers(teamId: string, memberIds: string[] = []) {
    await this.teamMemberRepository.delete({ teamId });

    const uniqueMemberIds = [...new Set(memberIds.filter(Boolean))];
    if (uniqueMemberIds.length === 0) {
      return;
    }

    await this.teamMemberRepository.save(
      uniqueMemberIds.map((userId) =>
        this.teamMemberRepository.create({ teamId, userId }),
      ),
    );
  }

  private async attachMembers(team: UserTeam) {
    const memberIds = await this.getMemberIds(team.id);
    const members = memberIds.length
      ? await this.userProfileRepository.find({
          where: { userId: In(memberIds), isRemoved: false },
        })
      : [];

    return {
      ...team,
      memberIds,
      members,
      memberCount: members.length,
    };
  }

  async findAll(organizationId: string) {
    const teams = await this.userTeamRepository.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(teams.map((team) => this.attachMembers(team)));
  }

  async findOne(id: string) {
    const team = await this.userTeamRepository.findOne({ where: { id } });
    if (!team) {
      return null;
    }

    return this.attachMembers(team);
  }

  async create(createUserTeamDto: any) {
    const { memberIds = [], ...teamData } = createUserTeamDto;
    const savedTeam = await this.userTeamRepository.save(
      this.userTeamRepository.create({
        ...teamData,
        isActive: teamData.isActive ?? true,
      }),
    );
    const userTeam = Array.isArray(savedTeam) ? savedTeam[0] : savedTeam;

    await this.syncMembers(userTeam.id, memberIds);
    return this.findOne(userTeam.id);
  }

  async update(id: string, updateUserTeamDto: any) {
    const { memberIds, ...teamData } = updateUserTeamDto;

    if (Object.keys(teamData).length > 0) {
      await this.userTeamRepository.update(id, teamData);
    }

    if (Array.isArray(memberIds)) {
      await this.syncMembers(id, memberIds);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.teamMemberRepository.delete({ teamId: id });
    await this.userTeamRepository.delete(id);
    return { message: 'User team deleted successfully' };
  }

  async addMember(teamId: string, userId: string) {
    const team = await this.findOne(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const memberIds = [...new Set([...(team.memberIds || []), userId])];
    await this.syncMembers(teamId, memberIds);
    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string) {
    const team = await this.findOne(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const memberIds = (team.memberIds || []).filter((id: string) => id !== userId);
    await this.syncMembers(teamId, memberIds);
    return this.findOne(teamId);
  }
}
