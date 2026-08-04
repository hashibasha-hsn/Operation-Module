import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginPolicySettings } from './login-policy.entity';

@Injectable()
export class LoginPolicyService {
  private static readonly SCOPE = 'default';

  constructor(
    @InjectRepository(LoginPolicySettings, 'auth')
    private readonly policyRepository: Repository<LoginPolicySettings>,
  ) {}

  async getPolicy(): Promise<LoginPolicySettings> {
    let policy = await this.policyRepository.findOne({
      where: { scopeKey: LoginPolicyService.SCOPE },
    });
    if (!policy) {
      policy = this.policyRepository.create({
        scopeKey: LoginPolicyService.SCOPE,
        maxFailedAttempts: 5,
        lockoutHours: 24,
      });
      policy = await this.policyRepository.save(policy);
    }
    return policy;
  }

  async updatePolicy(input: {
    maxFailedAttempts?: number;
    lockoutHours?: number;
  }): Promise<LoginPolicySettings> {
    const policy = await this.getPolicy();

    if (input.maxFailedAttempts !== undefined) {
      const max = Number(input.maxFailedAttempts);
      if (!Number.isInteger(max) || max < 1 || max > 100) {
        throw new BadRequestException('maxFailedAttempts must be an integer from 1 to 100');
      }
      policy.maxFailedAttempts = max;
    }

    if (input.lockoutHours !== undefined) {
      const hours = Number(input.lockoutHours);
      if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
        throw new BadRequestException('lockoutHours must be an integer from 1 to 720');
      }
      policy.lockoutHours = hours;
    }

    return this.policyRepository.save(policy);
  }
}
