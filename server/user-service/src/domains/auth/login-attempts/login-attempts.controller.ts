import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LoginAttemptService, LoginAttemptQuery } from './login-attempts.service';
import { LoginPolicyService } from './login-policy.service';

@Controller('auth/login-attempts')
export class LoginAttemptsController {
  constructor(
    private readonly loginAttemptService: LoginAttemptService,
    private readonly loginPolicyService: LoginPolicyService,
  ) {}

  @Get()
  findAll(@Query() query: LoginAttemptQuery) {
    return this.loginAttemptService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.loginAttemptService.getStats();
  }

  @Get('policy')
  getPolicy() {
    return this.loginPolicyService.getPolicy();
  }

  @Post('policy')
  updatePolicy(@Body() body: { maxFailedAttempts?: number; lockoutHours?: number }) {
    return this.loginPolicyService.updatePolicy(body);
  }
}
