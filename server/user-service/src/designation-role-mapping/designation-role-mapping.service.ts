import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignationRoleMapping } from './designation-role-mapping.entity';

@Injectable()
export class DesignationRoleMappingService {
  constructor(
    @InjectRepository(DesignationRoleMapping, 'user')
    private designationRoleMappingRepository: Repository<DesignationRoleMapping>,
  ) {}

  async create(mappingData: Partial<DesignationRoleMapping>): Promise<DesignationRoleMapping> {
    if (!mappingData.designationId || !mappingData.systemRoleId || !mappingData.organizationId) {
      throw new BadRequestException('designationId, systemRoleId, and organizationId are required');
    }
    // Prefer upsert so remapping is idempotent
    return this.upsertByDesignation(
      mappingData.designationId,
      mappingData.systemRoleId,
      mappingData.organizationId,
      mappingData.mappedBy,
    );
  }

  async findAll(organizationId: string): Promise<DesignationRoleMapping[]> {
    return await this.designationRoleMappingRepository.find({
      where: { organizationId },
      relations: ['designation', 'systemRole'],
    });
  }

  async findOne(id: string): Promise<DesignationRoleMapping> {
    return await this.designationRoleMappingRepository.findOne({
      where: { id },
      relations: ['designation', 'systemRole'],
    });
  }

  async findByDesignation(designationId: string): Promise<DesignationRoleMapping | null> {
    return await this.designationRoleMappingRepository.findOne({
      where: { designationId },
      relations: ['designation', 'systemRole'],
    });
  }

  /** Create or replace the Taqtics/system role mapped to a designation. */
  async upsertByDesignation(
    designationId: string,
    systemRoleId: string,
    organizationId: string,
    mappedBy?: string,
  ): Promise<DesignationRoleMapping> {
    if (!designationId || !systemRoleId || !organizationId) {
      throw new BadRequestException('designationId, systemRoleId, and organizationId are required');
    }

    const existing = await this.designationRoleMappingRepository.findOne({
      where: { designationId, organizationId },
    });

    if (existing) {
      existing.systemRoleId = systemRoleId;
      if (mappedBy !== undefined) existing.mappedBy = mappedBy;
      await this.designationRoleMappingRepository.save(existing);
      return this.findByDesignation(designationId);
    }

    const mapping = this.designationRoleMappingRepository.create({
      designationId,
      systemRoleId,
      organizationId,
      mappedBy: mappedBy || null,
    });
    await this.designationRoleMappingRepository.save(mapping);
    return this.findByDesignation(designationId);
  }

  async update(id: string, mappingData: Partial<DesignationRoleMapping>): Promise<DesignationRoleMapping> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Designation role mapping not found');
    }
    await this.designationRoleMappingRepository.update(id, mappingData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.designationRoleMappingRepository.delete(id);
  }

  async removeByDesignation(designationId: string): Promise<void> {
    await this.designationRoleMappingRepository.delete({ designationId });
  }

  async getSystemRoleForDesignation(designationId: string): Promise<{
    designationId: string;
    systemRoleId: string | null;
    systemRole: DesignationRoleMapping['systemRole'] | null;
  }> {
    const mapping = await this.findByDesignation(designationId);
    return {
      designationId,
      systemRoleId: mapping?.systemRoleId ?? null,
      systemRole: mapping?.systemRole ?? null,
    };
  }
}
