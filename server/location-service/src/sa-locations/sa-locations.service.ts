import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SaRegion } from './sa-region.entity';
import { SaCity } from './sa-city.entity';
import { SaDistrict } from './sa-district.entity';

@Injectable()
export class SaLocationsService {
  constructor(
    @InjectRepository(SaRegion)
    private readonly regionRepository: Repository<SaRegion>,
    @InjectRepository(SaCity)
    private readonly cityRepository: Repository<SaCity>,
    @InjectRepository(SaDistrict)
    private readonly districtRepository: Repository<SaDistrict>,
  ) {}

  private isSummaryRegion(region: Pick<SaRegion, 'name' | 'nameAr'>) {
    const label = `${region.name} ${region.nameAr ?? ''}`.toLowerCase();
    return label.includes('total') || label.includes('الإجمالي');
  }

  async findRegions(activeOnly = true) {
    const regions = await this.regionRepository.find({
      where: activeOnly ? { isActive: true } : {},
      order: { name: 'ASC' },
    });
    return regions.filter((region) => !this.isSummaryRegion(region));
  }

  async findRegion(id: string) {
    const region = await this.regionRepository.findOne({ where: { id } });
    if (!region) throw new NotFoundException('Region not found');
    return region;
  }

  findCities(regionId?: string, activeOnly = true) {
    return this.cityRepository.find({
      where: {
        ...(regionId ? { regionId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async findCity(id: string) {
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: ['region'],
    });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  findDistricts(cityId?: string, activeOnly = true) {
    return this.districtRepository.find({
      where: {
        ...(cityId ? { cityId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async findDistrict(id: string) {
    const district = await this.districtRepository.findOne({
      where: { id },
      relations: ['city', 'city.region'],
    });
    if (!district) throw new NotFoundException('District not found');
    return district;
  }

  async searchDistricts(query: string, limit = 50) {
    const term = `%${query.trim()}%`;
    if (!query.trim()) return [];

    return this.districtRepository.find({
      where: [
        { name: ILike(term), isActive: true },
        { nameAr: ILike(term), isActive: true },
      ],
      relations: ['city', 'city.region'],
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async getStats() {
    const [regions, cities, districts] = await Promise.all([
      this.regionRepository.count(),
      this.cityRepository.count(),
      this.districtRepository.count(),
    ]);
    return { regions, cities, districts };
  }

  async createRegion(data: Partial<SaRegion>) {
    const region = this.regionRepository.create(data);
    return this.regionRepository.save(region);
  }

  async createCity(data: Partial<SaCity>) {
    await this.findRegion(data.regionId);
    const city = this.cityRepository.create(data);
    return this.cityRepository.save(city);
  }

  async createDistrict(data: Partial<SaDistrict>) {
    await this.findCity(data.cityId);
    const district = this.districtRepository.create(data);
    return this.districtRepository.save(district);
  }

  async updateRegion(id: string, data: Partial<SaRegion>) {
    await this.findRegion(id);
    await this.regionRepository.update(id, data);
    return this.findRegion(id);
  }

  async updateCity(id: string, data: Partial<SaCity>) {
    await this.findCity(id);
    await this.cityRepository.update(id, data);
    return this.findCity(id);
  }

  async updateDistrict(id: string, data: Partial<SaDistrict>) {
    await this.findDistrict(id);
    await this.districtRepository.update(id, data);
    return this.findDistrict(id);
  }
}
