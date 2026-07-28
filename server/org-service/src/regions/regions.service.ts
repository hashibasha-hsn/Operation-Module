import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './region.entity';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region, 'org')
    private readonly regionRepository: Repository<Region>,
  ) {}

  async create(createRegionDto: any): Promise<Region> {
    const region = this.regionRepository.create(createRegionDto);
    const savedRegion = await this.regionRepository.save(region);
    return Array.isArray(savedRegion) ? savedRegion[0] : savedRegion;
  }

  async findAll(): Promise<Region[]> {
    return await this.regionRepository.find();
  }

  async findByOrg(orgId: string): Promise<Region[]> {
    return await this.regionRepository.find({ where: { orgId } });
  }

  async findOne(id: string): Promise<Region> {
    return await this.regionRepository.findOne({ where: { id } });
  }

  async update(id: string, updateRegionDto: any): Promise<Region> {
    await this.regionRepository.update(id, updateRegionDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.regionRepository.delete(id);
  }
}
