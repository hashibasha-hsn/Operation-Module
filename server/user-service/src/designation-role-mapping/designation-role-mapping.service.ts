import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignationRoleMapping } from './designation-role-mapping.entity';

@Injectable()
export class DesignationRoleMappingService {
  constructor(
    @InjectRepository(DesignationRoleMapping)
    private designationRoleMappingRepository: Repository<DesignationRoleMapping>,
  ) {}

  async create(mappingData: Partial<DesignationRoleMapping>): Promise<DesignationRoleMapping> {
    const mapping = this.designationRoleMappingRepository.create(mappingData);
    return await this.designationRoleMappingRepository.save(mapping);
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

  async findByDesignation(designationId: string): Promise<DesignationRoleMapping> {
    return await this.designationRoleMappingRepository.findOne({
      where: { designationId },
      relations: ['systemRole'],
    });
  }

  async update(id: string, mappingData: Partial<DesignationRoleMapping>): Promise<DesignationRoleMapping> {
    await this.designationRoleMappingRepository.update(id, mappingData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.designationRoleMappingRepository.delete(id);
  }

  async removeByDesignation(designationId: string): Promise<void> {
    await this.designationRoleMappingRepository.delete({ designationId });
  }

  async getSystemRoleForDesignation(designationId: string): Promise<string> {
    const mapping = await this.findByDesignation(designationId);
    return mapping ? mapping.systemRoleId : null;
  }
}
