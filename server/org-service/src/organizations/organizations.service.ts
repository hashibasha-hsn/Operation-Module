import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: any): Promise<Organization> {
    const organization = this.organizationRepository.create(createOrganizationDto);
    const savedOrganization = await this.organizationRepository.save(organization);
    return Array.isArray(savedOrganization) ? savedOrganization[0] : savedOrganization;
  }

  async findAll(): Promise<Organization[]> {
    return await this.organizationRepository.find();
  }

  async findOne(id: string): Promise<Organization> {
    return await this.organizationRepository.findOne({ where: { id } });
  }

  async findBySubdomain(subdomain: string): Promise<Organization> {
    return await this.organizationRepository.findOne({ where: { subdomain } });
  }

  async update(id: string, updateOrganizationDto: any): Promise<Organization> {
    await this.organizationRepository.update(id, updateOrganizationDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.organizationRepository.delete(id);
  }
}
