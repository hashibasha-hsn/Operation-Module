import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { UsersModule as ProfileUsersModule } from '../../../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PasswordPolicySettings } from './password-policy-settings.entity';
import { PasswordPolicyService } from './password-policy.service';

@Module({
  imports: [
    UsersModule,
    ProfileUsersModule,
    SessionsModule,
    TypeOrmModule.forFeature([PasswordPolicySettings], 'auth'),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, PasswordPolicyService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PasswordPolicyService],
})
export class AuthModule {}
