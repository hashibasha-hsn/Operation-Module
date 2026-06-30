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

    let queryBuilder = this.userProfileRepository
      .createQueryBuilder('userProfile')
      .where('userProfile.isRemoved = :isRemoved', { isRemoved: false });

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        'userProfile.name ILIKE :search OR userProfile.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('userProfile.createdAt', 'DESC')
      .getManyAndCount();

    const enrichedUsers = await this.enrichWithLastLogin(users);

    return {
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async enrichWithLastLogin(users: UserProfile[]) {
    if (!users.length) {
      return users;
    }

    try {
      const axios = require('axios');
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';
      const response = await axios.get(`${authServiceUrl}/auth/users/last-logins`, {
        timeout: 5000,
      });

      const logins: { userId: string; email: string; lastLoginAt: string | null }[] =
        response.data?.logins || [];
      const byUserId = new Map(logins.map((entry) => [entry.userId, entry.lastLoginAt]));
      const byEmail = new Map(
        logins
          .filter((entry) => entry.email)
          .map((entry) => [entry.email.toLowerCase(), entry.lastLoginAt]),
      );

      return users.map((user) => {
        const authLastLogin =
          byUserId.get(user.userId) ||
          (user.email ? byEmail.get(user.email.toLowerCase()) : null);
        const resolvedLastLogin = user.lastLogin || authLastLogin;

        return resolvedLastLogin ? { ...user, lastLogin: resolvedLastLogin } : user;
      });
    } catch (error: any) {
      console.error(
        'Failed to enrich users with auth last login:',
        error?.response?.data?.message || error?.message,
      );
      return users;
    }
  }

  async updateLastLogin(userId: string, lastLogin: Date) {
    await this.userProfileRepository.update({ userId }, { lastLogin });
    return this.findOne(userId);
  }

  async findOne(id: string) {
    return await this.userProfileRepository.findOne({ where: { userId: id } });
  }

  async create(createUserDto: any) {
    const payload = {
      ...createUserDto,
      tags: createUserDto.tags ?? {},
      storeName: createUserDto.storeName ?? createUserDto.entity ?? undefined,
    };

    if (typeof payload.tags === 'string') {
      try {
        payload.tags = JSON.parse(payload.tags);
      } catch {
        payload.tags = {};
      }
    }

    const userProfile = this.userProfileRepository.create(payload);
    const savedProfile = await this.userProfileRepository.save(userProfile);
    const saved = Array.isArray(savedProfile) ? savedProfile[0] : savedProfile;
    await this.writeAuditLog({
      target: 'User',
      operation: 'Create',
      performedBy: createUserDto.performedBy || createUserDto.actorEmail || saved.email,
      details: { email: saved.email, name: saved.name },
      targetId: saved.userId,
    });
    return saved;
  }

  async bulkCreate(users: any[]) {
    const created: UserProfile[] = [];
    const errors: { email?: string; name?: string; error: string }[] = [];

    for (const userDto of users) {
      try {
        const name = (userDto.name || '').trim();
        const email = (userDto.email || '').trim();

        if (!name || !email) {
          errors.push({
            email: userDto.email,
            name: userDto.name,
            error: 'Name and email are required',
          });
          continue;
        }

        const saved = await this.create({
          ...userDto,
          name,
          email,
          password: userDto.password || 'ChangeMe123!',
        });
        created.push(saved);
      } catch (error: any) {
        errors.push({
          email: userDto.email,
          name: userDto.name,
          error: error?.message || 'Failed to create user',
        });
      }
    }

    return {
      created: created.length,
      failed: errors.length,
      users: created,
      errors,
    };
  }

  async update(id: string, updateUserDto: any) {
    const { performedBy, actorEmail, ...payload } = updateUserDto;
    const before = await this.findOne(id);
    await this.userProfileRepository.update({ userId: id }, payload);
    const updated = await this.findOne(id);
    await this.writeAuditLog({
      target: 'User',
      operation: 'Update',
      performedBy: performedBy || actorEmail || before?.email || id,
      details: {
        email: updated?.email,
        name: updated?.name,
      },
      targetId: id,
    });
    return updated;
  }

  async remove(id: string) {
    const before = await this.findOne(id);
    await this.userProfileRepository.update(
      { userId: id },
      { isRemoved: true, isActive: false },
    );
    await this.writeAuditLog({
      target: 'User',
      operation: 'Discard',
      performedBy: before?.email || id,
      details: {
        email: before?.email,
        name: before?.name,
      },
      targetId: id,
    });
    return { message: 'User removed successfully' };
  }

  private async writeAuditLog(payload: {
    target: string;
    operation: string;
    performedBy: string;
    details?: Record<string, unknown>;
    targetId?: string;
  }) {
    try {
      const axios = require('axios');
      const orgServiceUrl = process.env.ORG_SERVICE_URL || 'http://localhost:3012';
      await axios.post(
        `${orgServiceUrl}/audit-logs`,
        { ...payload, organizationId: 'default-org' },
        { timeout: 3000 },
      );
    } catch (error: any) {
      console.error('Failed to write audit log:', error?.message || error);
    }
  }

  async findRemoved() {
    return this.userProfileRepository.find({
      where: { isRemoved: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async restore(id: string) {
    await this.userProfileRepository.update(
      { userId: id },
      { isRemoved: false, isActive: true },
    );
    return this.findOne(id);
  }

  async updateAdvanceMapping(id: string, additionalStores: string[]) {
    await this.userProfileRepository.update({ userId: id }, { additionalStores });
    return this.findOne(id);
  }

  async updateHybrid(
    id: string,
    data: { isHybrid: boolean; hybridStores: string[] },
  ) {
    await this.userProfileRepository.update({ userId: id }, data);
    return this.findOne(id);
  }

  async getStats() {
    const totalUsers = await this.userProfileRepository.count({
      where: { isRemoved: false },
    });

    const activeUsers = await this.userProfileRepository.count({
      where: { isRemoved: false, isActive: true },
    });

    const inactiveUsers = await this.userProfileRepository.count({
      where: { isRemoved: false, isActive: false },
    });

    const validEmails = await this.userProfileRepository.count({
      where: { isRemoved: false, validEmail: true },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      validEmails,
    };
  }
}
