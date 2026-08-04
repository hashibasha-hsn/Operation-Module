import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';

export interface RecordLoginAttemptInput {
  email: string;
  userId?: string | null;
  success: boolean;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginAttemptQuery {
  email?: string;
  success?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt, 'auth')
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async record(input: RecordLoginAttemptInput): Promise<LoginAttempt> {
    const attempt = this.loginAttemptRepository.create({
      email: input.email?.trim().toLowerCase() ?? '',
      userId: input.userId ?? null,
      success: input.success,
      reason: input.reason ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
    return this.loginAttemptRepository.save(attempt);
  }

  async countFailedForEmail(email: string, since: Date): Promise<number> {
    const normalized = email?.trim().toLowerCase() ?? '';
    if (!normalized) return 0;
    return this.loginAttemptRepository.count({
      where: {
        email: normalized,
        success: false,
        createdAt: MoreThan(since),
      },
    });
  }

  async countFailedForIp(ipAddress: string, since: Date): Promise<number> {
    if (!ipAddress) return 0;
    return this.loginAttemptRepository.count({
      where: {
        ipAddress,
        success: false,
        createdAt: MoreThan(since),
      },
    });
  }

  async hasRecentSuccess(email: string, since: Date): Promise<boolean> {
    const normalized = email?.trim().toLowerCase() ?? '';
    if (!normalized) return false;
    const found = await this.loginAttemptRepository.findOne({
      where: {
        email: normalized,
        success: true,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    });
    return Boolean(found);
  }

  async findAll(query: LoginAttemptQuery = {}) {
    const qb = this.loginAttemptRepository.createQueryBuilder('la');

    if (query.email?.trim()) {
      qb.andWhere('LOWER(la.email) = :email', { email: query.email.trim().toLowerCase() });
    }
    if (query.success === 'true') {
      qb.andWhere('la.success = :success', { success: true });
    } else if (query.success === 'false') {
      qb.andWhere('la.success = :success', { success: false });
    }
    if (query.from) {
      qb.andWhere('la.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('la.createdAt <= :to', { to: new Date(query.to) });
    }

    const limit = Math.min(
      500,
      Math.max(1, Number.parseInt(query.limit ?? '50', 10) || 50),
    );
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);

    const [items, total] = await qb
      .orderBy('la.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async getStats() {
    const total = await this.loginAttemptRepository.count();
    const failed = await this.loginAttemptRepository.count({ where: { success: false } });
    const success = total - failed;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const failedToday = await this.loginAttemptRepository.count({
      where: { success: false, createdAt: MoreThan(todayStart) },
    });
    const successToday = await this.loginAttemptRepository.count({
      where: { success: true, createdAt: MoreThan(todayStart) },
    });

    return {
      total,
      success,
      failed,
      today: { success: successToday, failed: failedToday },
    };
  }
}
