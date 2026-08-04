import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAttempt } from './login-attempt.entity';
import { LoginAttemptService } from './login-attempts.service';
import { LoginAttemptsController } from './login-attempts.controller';
import { LoginPolicySettings } from './login-policy.entity';
import { LoginPolicyService } from './login-policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoginAttempt, LoginPolicySettings], 'auth')],
  controllers: [LoginAttemptsController],
  providers: [LoginAttemptService, LoginPolicyService],
  exports: [LoginAttemptService, LoginPolicyService],
})
export class LoginAttemptsModule {}
