import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(UserProfile, 'user')
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async create(createProfileDto: any): Promise<UserProfile> {
    const profile = this.profileRepository.create(createProfileDto);
    const savedProfile = await this.profileRepository.save(profile);
    return Array.isArray(savedProfile) ? savedProfile[0] : savedProfile;
  }

  async findByUserId(userId: string): Promise<UserProfile> {
    return await this.profileRepository.findOne({ where: { userId } });
  }

  async update(userId: string, updateProfileDto: any): Promise<UserProfile> {
    await this.profileRepository.update({ userId }, updateProfileDto);
    return await this.findByUserId(userId);
  }

  async remove(userId: string): Promise<void> {
    await this.profileRepository.delete({ userId });
  }
}
