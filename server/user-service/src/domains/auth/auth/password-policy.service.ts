import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordPolicySettings } from './password-policy-settings.entity';
import { User } from '../users/user.entity';

export type PasswordRotationStatus = {
  passwordChangedAt: string | null;
  passwordExpiryDays: number;
  warnBeforeExpiryDays: number;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  mustChangePassword: boolean;
  passwordExpiringSoon: boolean;
};

@Injectable()
export class PasswordPolicyService {
  private static readonly SCOPE = 'default';
  private static readonly ALLOWED_EXPIRY = new Set([0, 30, 60, 90, 180]);

  constructor(
    @InjectRepository(PasswordPolicySettings, 'auth')
    private readonly policyRepository: Repository<PasswordPolicySettings>,
  ) {}

  async getPolicy(): Promise<PasswordPolicySettings> {
    let policy = await this.policyRepository.findOne({
      where: { scopeKey: PasswordPolicyService.SCOPE },
    });
    if (!policy) {
      policy = this.policyRepository.create({
        scopeKey: PasswordPolicyService.SCOPE,
        passwordExpiryDays: 90,
        warnBeforeExpiryDays: 7,
      });
      policy = await this.policyRepository.save(policy);
    }
    return policy;
  }

  async updatePolicy(input: {
    passwordExpiryDays?: number;
    warnBeforeExpiryDays?: number;
  }): Promise<PasswordPolicySettings> {
    const policy = await this.getPolicy();

    if (input.passwordExpiryDays !== undefined) {
      const days = Number(input.passwordExpiryDays);
      if (!PasswordPolicyService.ALLOWED_EXPIRY.has(days)) {
        throw new BadRequestException(
          'passwordExpiryDays must be one of: 0, 30, 60, 90, 180',
        );
      }
      policy.passwordExpiryDays = days;
    }

    if (input.warnBeforeExpiryDays !== undefined) {
      const warn = Number(input.warnBeforeExpiryDays);
      if (!Number.isInteger(warn) || warn < 0 || warn > 90) {
        throw new BadRequestException('warnBeforeExpiryDays must be an integer from 0 to 90');
      }
      policy.warnBeforeExpiryDays = warn;
    }

    return this.policyRepository.save(policy);
  }

  getPasswordChangedAt(user: User): Date | null {
    if (user.passwordChangedAt) return new Date(user.passwordChangedAt);
    if (user.createdAt) return new Date(user.createdAt);
    return null;
  }

  async getRotationStatus(user: User): Promise<PasswordRotationStatus> {
    const policy = await this.getPolicy();
    const changedAt = this.getPasswordChangedAt(user);
    const expiryDays = policy.passwordExpiryDays;

    if (!expiryDays || expiryDays <= 0 || !changedAt) {
      return {
        passwordChangedAt: changedAt?.toISOString() ?? null,
        passwordExpiryDays: expiryDays,
        warnBeforeExpiryDays: policy.warnBeforeExpiryDays,
        expiresAt: null,
        daysUntilExpiry: null,
        mustChangePassword: false,
        passwordExpiringSoon: false,
      };
    }

    const expiresAt = new Date(changedAt);
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / msPerDay);
    const mustChangePassword = daysUntilExpiry <= 0;
    const passwordExpiringSoon =
      !mustChangePassword &&
      policy.warnBeforeExpiryDays > 0 &&
      daysUntilExpiry <= policy.warnBeforeExpiryDays;

    return {
      passwordChangedAt: changedAt.toISOString(),
      passwordExpiryDays: expiryDays,
      warnBeforeExpiryDays: policy.warnBeforeExpiryDays,
      expiresAt: expiresAt.toISOString(),
      daysUntilExpiry,
      mustChangePassword,
      passwordExpiringSoon,
    };
  }
}
