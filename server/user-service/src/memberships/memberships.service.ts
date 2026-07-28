import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgMembership } from './org-membership.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(OrgMembership, 'user')
    private readonly membershipRepository: Repository<OrgMembership>,
  ) {}

  async createMembership(createMembershipDto: any): Promise<OrgMembership> {
    const membership = this.membershipRepository.create(createMembershipDto);
    const savedMembership = await this.membershipRepository.save(membership);
    return Array.isArray(savedMembership) ? savedMembership[0] : savedMembership;
  }

  async findByUserId(userId: string): Promise<OrgMembership[]> {
    return await this.membershipRepository.find({ 
      where: { userId },
      relations: ['role']
    });
  }

  async findByOrgId(orgId: string): Promise<OrgMembership[]> {
    return await this.membershipRepository.find({ 
      where: { orgId },
      relations: ['role']
    });
  }

  async findByUserAndOrg(userId: string, orgId: string): Promise<OrgMembership> {
    return await this.membershipRepository.findOne({ 
      where: { userId, orgId },
      relations: ['role']
    });
  }

  async updateRole(userId: string, orgId: string, roleId: string): Promise<OrgMembership> {
    await this.membershipRepository.update({ userId, orgId }, { roleId });
    return await this.findByUserAndOrg(userId, orgId);
  }

  async updateScope(userId: string, orgId: string, scopeId: string): Promise<OrgMembership> {
    await this.membershipRepository.update({ userId, orgId }, { scopeId });
    return await this.findByUserAndOrg(userId, orgId);
  }

  async removeMembership(userId: string, orgId: string): Promise<void> {
    await this.membershipRepository.delete({ userId, orgId });
  }
}
