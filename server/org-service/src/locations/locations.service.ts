import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: any): Promise<Location> {
    const location = this.locationRepository.create(createLocationDto);
    const savedLocation = await this.locationRepository.save(location);
    return Array.isArray(savedLocation) ? savedLocation[0] : savedLocation;
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find();
  }

  async findByOrg(orgId: string): Promise<Location[]> {
    return await this.locationRepository.find({ where: { orgId } });
  }

  async findByRegion(regionId: string): Promise<Location[]> {
    return await this.locationRepository.find({ where: { regionId } });
  }

  async findOne(id: string): Promise<Location> {
    return await this.locationRepository.findOne({ where: { id } });
  }

  async update(id: string, updateLocationDto: any): Promise<Location> {
    await this.locationRepository.update(id, updateLocationDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.locationRepository.delete(id);
  }
}
