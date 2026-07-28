import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from './designation.entity';
import { DesignationRoleMappingService } from '../designation-role-mapping/designation-role-mapping.service';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(Designation, 'user')
    private designationsRepository: Repository<Designation>,
    private designationRoleMappingService: DesignationRoleMappingService,
  ) {}

  async create(designationData: Partial<Designation>): Promise<Designation> {
    const designation = this.designationsRepository.create(designationData);
    return await this.designationsRepository.save(designation);
  }

  async findAll(organizationId: string, name?: string): Promise<Designation[]> {
    const where: Record<string, unknown> = { organizationId, isActive: true };
    if (name?.trim()) {
      // Case-insensitive exact match for designation → role resolution
      return this.designationsRepository
        .createQueryBuilder('designation')
        .leftJoinAndSelect('designation.reportingDesignation', 'reportingDesignation')
        .where('designation.organizationId = :organizationId', { organizationId })
        .andWhere('designation.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(designation.name) = LOWER(:name)', { name: name.trim() })
        .getMany();
    }

    return await this.designationsRepository.find({
      where,
      relations: ['reportingDesignation'],
    });
  }

  async findByName(name: string, organizationId: string): Promise<Designation | null> {
    const rows = await this.findAll(organizationId, name);
    return rows[0] || null;
  }

  async findOne(id: string): Promise<Designation> {
    return await this.designationsRepository.findOne({
      where: { id },
      relations: ['reportingDesignation', 'subordinates'],
    });
  }

  async update(id: string, designationData: Partial<Designation>): Promise<Designation> {
    await this.designationsRepository.update(id, designationData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // First, delete the designation-role mapping
    await this.designationRoleMappingService.removeByDesignation(id);
    
    // Then delete the designation
    await this.designationsRepository.delete(id);
  }

  async findByReportingDesignation(reportingDesignationId: string): Promise<Designation[]> {
    return await this.designationsRepository.find({
      where: { reportingDesignationId, isActive: true },
    });
  }
}
