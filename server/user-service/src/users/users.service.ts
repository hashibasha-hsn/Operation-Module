import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../profiles/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    let queryBuilder = this.userProfileRepository.createQueryBuilder('userProfile');
    
    if (search) {
      queryBuilder = queryBuilder.where(
        'userProfile.firstName LIKE :search OR userProfile.lastName LIKE :search OR userProfile.email LIKE :search',
        { search: `%${search}%` }
      );
    }
    
    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('userProfile.createdAt', 'DESC')
      .getManyAndCount();
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return await this.userProfileRepository.findOne({ where: { userId: id } });
  }

  async create(createUserDto: any) {
    const userProfile = this.userProfileRepository.create(createUserDto);
    const savedProfile = await this.userProfileRepository.save(userProfile);
    return Array.isArray(savedProfile) ? savedProfile[0] : savedProfile;
  }

  async update(id: string, updateUserDto: any) {
    await this.userProfileRepository.update({ userId: id }, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.userProfileRepository.delete({ userId: id });
    return { message: 'User deleted successfully' };
  }

  async getStats() {
    const totalUsers = await this.userProfileRepository.count();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await this.userProfileRepository
      .createQueryBuilder('userProfile')
      .where('userProfile.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();
    
    return {
      totalUsers,
      activeUsers: totalUsers, // All users are considered active for now
      inactiveUsers: 0,
      recentUsers,
    };
  }
}
