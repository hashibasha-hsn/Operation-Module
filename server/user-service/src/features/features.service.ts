import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from './feature.entity';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(Feature, 'user')
    private featuresRepository: Repository<Feature>,
  ) {}

  async create(featureData: Partial<Feature>): Promise<Feature> {
    const feature = this.featuresRepository.create(featureData);
    return await this.featuresRepository.save(feature);
  }

  async findAll(): Promise<Feature[]> {
    return await this.featuresRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Feature> {
    return await this.featuresRepository.findOne({ where: { id } });
  }

  async findByCategory(category: string): Promise<Feature[]> {
    return await this.featuresRepository.find({
      where: { category, isActive: true },
    });
  }

  async update(id: string, featureData: Partial<Feature>): Promise<Feature> {
    await this.featuresRepository.update(id, featureData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.featuresRepository.update(id, { isActive: false });
  }
}
