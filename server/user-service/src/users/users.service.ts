import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../profiles/user-profile.entity';
import {
  buildProfileCompletionStatus,
  completionTrackingFields,
} from './profile-completion.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile, 'user')
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  private withCompletionMeta(profile: UserProfile | (UserProfile & Record<string, any>) | null) {
    if (!profile) return null;
    const completion = buildProfileCompletionStatus(profile as UserProfile);
    return {
      ...profile,
      profileSetupComplete: completion.profileSetupComplete,
      profileSetupCompletedAt: completion.profileSetupCompletedAt
        ? new Date(completion.profileSetupCompletedAt)
        : profile.profileSetupCompletedAt,
      profileCompletion: completion,
    };
  }

  private async applyCompletionTracking(userId: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    if (!profile) return null;
    const tracking = completionTrackingFields(profile, profile.profileSetupCompletedAt);
    if (
      profile.profileSetupComplete !== tracking.profileSetupComplete ||
      (tracking.profileSetupComplete && !profile.profileSetupCompletedAt) ||
      (!tracking.profileSetupComplete && Boolean(profile.profileSetupCompletedAt))
    ) {
      await this.userProfileRepository.update({ userId }, tracking);
      return this.userProfileRepository.findOne({ where: { userId } });
    }
    return profile;
  }

  /** Normalize client payloads for create/update profile fields. */
  private prepareProfilePayload(dto: any, { requireIdentity = false } = {}) {
    const {
      performedBy,
      actorEmail,
      status,
      completeProfileSetup,
      validateProfileSetup,
      ...rest
    } = dto || {};
    const payload: Record<string, any> = { ...rest };
    const strictSetup = Boolean(completeProfileSetup || validateProfileSetup);

    if (typeof payload.name === 'string') payload.name = payload.name.trim();
    if (typeof payload.email === 'string') payload.email = payload.email.trim().toLowerCase();
    if (typeof payload.manager === 'string') payload.manager = payload.manager.trim();
    if (typeof payload.storeName === 'string') payload.storeName = payload.storeName.trim();
    if (typeof payload.phone === 'string') payload.phone = payload.phone.trim() || null;
    if (typeof payload.designation === 'string') {
      payload.designation = payload.designation.trim() || null;
    }
    if (typeof payload.entityId === 'string') {
      payload.entityId = payload.entityId.trim() || null;
    }

    // Map legacy status → isActive when clients still send it
    if (status !== undefined && payload.isActive === undefined) {
      const normalized = String(status).toLowerCase();
      payload.isActive = !(normalized === 'inactive' || normalized === 'false' || status === false);
    }

    if (payload.storeName === undefined && payload.entity) {
      payload.storeName = payload.entity;
    }
    delete payload.entity;

    if (requireIdentity) {
      if (!payload.name || !payload.email) {
        throw new BadRequestException('Name and email are required');
      }
    }

    if (strictSetup) {
      if (!payload.name) {
        throw new BadRequestException('Name is required');
      }
      if (!payload.entityId) {
        throw new BadRequestException('Store (entityId) is required');
      }
    } else {
      // Allow admin creates/updates to omit optional store/manager without wiping required intent
      if (payload.entityId === null || payload.entityId === '') delete payload.entityId;
      if (payload.manager === null || payload.manager === '') delete payload.manager;
      if (payload.storeName === null || payload.storeName === '') delete payload.storeName;
    }

    return { payload, performedBy, actorEmail };
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(1000, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

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
      .take(limitNum)
      .orderBy('userProfile.createdAt', 'DESC')
      .getManyAndCount();

    const enrichedUsers = await this.enrichWithLastLogin(users);

    return {
      users: enrichedUsers.map((user) => this.withCompletionMeta(user)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 0,
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

        if (!resolvedLastLogin) return user;
        return {
          ...user,
          lastLogin:
            resolvedLastLogin instanceof Date
              ? resolvedLastLogin
              : new Date(resolvedLastLogin),
        };
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
    const profile = await this.applyCompletionTracking(id);
    return this.withCompletionMeta(profile);
  }

  async getProfileCompletion(id: string) {
    const profile = await this.applyCompletionTracking(id);
    if (!profile) {
      throw new BadRequestException('User profile not found');
    }
    return buildProfileCompletionStatus(profile);
  }

  async create(createUserDto: any) {
    const { payload: prepared, performedBy, actorEmail } = this.prepareProfilePayload(
      createUserDto,
      { requireIdentity: true },
    );

    const tracking = completionTrackingFields(prepared as Partial<UserProfile>);
    const payload = {
      ...prepared,
      ...tracking,
      tags: prepared.tags ?? {},
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
      performedBy: performedBy || actorEmail || saved.email,
      details: {
        email: saved.email,
        name: saved.name,
        profileSetupComplete: saved.profileSetupComplete,
      },
      targetId: saved.userId,
    });
    return this.withCompletionMeta(saved);
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
    const { payload, performedBy, actorEmail } = this.prepareProfilePayload(updateUserDto);
    const before = await this.userProfileRepository.findOne({ where: { userId: id } });
    await this.userProfileRepository.update({ userId: id }, payload);
    const updated = await this.findOne(id);
    await this.writeAuditLog({
      target: 'User',
      operation: 'Update',
      performedBy: performedBy || actorEmail || before?.email || id,
      details: {
        email: updated?.email,
        name: updated?.name,
        profileSetupComplete: updated?.profileSetupComplete,
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
      const auditLogServiceUrl =
        process.env.AUDIT_LOG_SERVICE_URL || 'http://localhost:3015';
      await axios.post(
        `${auditLogServiceUrl}/audit-logs`,
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
