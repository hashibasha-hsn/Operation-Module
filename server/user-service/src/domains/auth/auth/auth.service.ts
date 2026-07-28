import { Injectable, UnauthorizedException, Inject, Optional, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/user.entity';
import { assertPasswordValid } from './password.util';
import { PasswordPolicyService } from './password-policy.service';

@Injectable()
export class AuthService {
  private static readonly OTP_TTL_MS = 10 * 60 * 1000;
  private static readonly OTP_RESEND_COOLDOWN_MS = 30 * 1000;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly passwordPolicyService: PasswordPolicyService,
    @Optional() @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientProxy,
  ) {}

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  private createPendingOtpToken(user: User, rememberMe: boolean) {
    return this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
        purpose: 'login-otp',
        rememberMe,
      },
      { expiresIn: '10m' },
    );
  }

  private verifyPendingOtpToken(token: string): {
    sub: string;
    email: string;
    purpose: string;
    rememberMe?: boolean;
  } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired OTP challenge');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return null;
    }

    // First check auth service database
    let user = await this.usersService.findByEmail(normalizedEmail);
    
    // If not found in auth database, check user service and create in auth database
    if (!user) {
      try {
        const axios = require('axios');
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.get(
          `${userServiceUrl}/users?search=${encodeURIComponent(normalizedEmail)}&limit=50`,
          { timeout: 5000 },
        );
        const profiles = response.data?.users ?? [];
        const userProfile = profiles.find(
          (profile: { email?: string }) =>
            profile.email?.trim().toLowerCase() === normalizedEmail,
        );

        if (userProfile) {
          try {
            user = await this.usersService.create({
              id: userProfile.userId,
              email: userProfile.email?.trim().toLowerCase() ?? normalizedEmail,
              password: userProfile.password,
              verificationStatus: 'VERIFIED',
            });
          } catch {
            user = await this.usersService.findOne(userProfile.userId);
            if (!user) {
              user = await this.usersService.findByEmail(normalizedEmail);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user from user-service:', error.message);
      }
    }
    
    if (!user) {
      return null;
    }

    // For dummy users, check if password matches directly
    if (user.verificationStatus === 'DUMMY') {
      const bcrypt = require('bcrypt');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }
      return user;
    }

    // For verified users, check password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: any, ipAddress?: string, userAgent?: string, rememberMe = true) {
    if (user.twoFactorEnabled) {
      const pendingToken = await this.generateAndSendLoginOtp(user, rememberMe);
      return {
        requiresOtp: true,
        pendingToken,
        email: user.email,
        otpExpiresInSeconds: Math.floor(AuthService.OTP_TTL_MS / 1000),
      };
    }

    return this.issueLoginSession(user, ipAddress, userAgent, rememberMe);
  }

  private async issueLoginSession(
    user: any,
    ipAddress?: string,
    userAgent?: string,
    rememberMe = true,
  ) {
    const loginTime = new Date();
    await this.usersService.updateLastLogin(user.id);
    await this.syncLastLoginToUserService(user.id, loginTime);

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    await this.sessionsService.deleteSessionsForUser(user.id);
    await this.sessionsService.revokeRefreshTokensForUser(user.id);

    // Create session
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 1);

    await this.sessionsService.createSession({
      userId: user.id,
      token: accessToken,
      expiresAt: sessionExpiresAt,
      ipAddress,
      userAgent,
    });

    // Remember me: 30-day refresh; otherwise 1-day (browser session-aligned)
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + (rememberMe ? 30 : 1));

    await this.sessionsService.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    // Emit Kafka event for login (fire and forget, don't await)
    if (this.kafkaClient) {
      this.kafkaClient.emit('user.login', {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      }).subscribe({
        error: (err) => console.error('Kafka emit error (non-blocking):', err.message)
      });
    }

    const rotation = await this.passwordPolicyService.getRotationStatus(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        verificationStatus: user.verificationStatus,
        mustChangePassword: rotation.mustChangePassword,
        passwordExpiringSoon: rotation.passwordExpiringSoon,
        daysUntilExpiry: rotation.daysUntilExpiry,
        passwordExpiresAt: rotation.expiresAt,
      },
      passwordPolicy: {
        passwordExpiryDays: rotation.passwordExpiryDays,
        warnBeforeExpiryDays: rotation.warnBeforeExpiryDays,
        mustChangePassword: rotation.mustChangePassword,
        passwordExpiringSoon: rotation.passwordExpiringSoon,
        daysUntilExpiry: rotation.daysUntilExpiry,
        passwordExpiresAt: rotation.expiresAt,
      },
    };
  }

  async getTwoFactorSettings(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { enabled: Boolean(user.twoFactorEnabled) };
  }

  async updateTwoFactorSettings(userId: string, enabled: boolean) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const updated = await this.usersService.updateTwoFactorSettings(userId, enabled);
    return { enabled: Boolean(updated.twoFactorEnabled) };
  }

  async verifyLoginOtp(
    pendingToken: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = this.verifyPendingOtpToken(pendingToken);
    if (payload.purpose !== 'login-otp') {
      throw new UnauthorizedException('Invalid OTP challenge');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user?.twoFactorEnabled || !user.twoFactorOtpHash || !user.twoFactorOtpExpiresAt) {
      throw new UnauthorizedException('OTP challenge not found');
    }

    if (user.twoFactorOtpExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearTwoFactorOtp(user.id);
      throw new UnauthorizedException('OTP expired');
    }

    const validOtp = await bcrypt.compare(otp?.trim() ?? '', user.twoFactorOtpHash);
    if (!validOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.usersService.clearTwoFactorOtp(user.id);
    return this.issueLoginSession(user, ipAddress, userAgent, payload.rememberMe !== false);
  }

  async resendLoginOtp(pendingToken: string) {
    const payload = this.verifyPendingOtpToken(pendingToken);
    if (payload.purpose !== 'login-otp') {
      throw new UnauthorizedException('Invalid OTP challenge');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user?.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor authentication is disabled');
    }

    if (
      user.twoFactorOtpRequestedAt &&
      Date.now() - new Date(user.twoFactorOtpRequestedAt).getTime() <
        AuthService.OTP_RESEND_COOLDOWN_MS
    ) {
      throw new BadRequestException('Please wait before requesting another OTP');
    }

    const nextPendingToken = await this.generateAndSendLoginOtp(
      user,
      payload.rememberMe !== false,
    );
    return {
      requiresOtp: true,
      pendingToken: nextPendingToken,
      email: user.email,
      otpExpiresInSeconds: Math.floor(AuthService.OTP_TTL_MS / 1000),
    };
  }

  private async generateAndSendLoginOtp(user: User, rememberMe: boolean) {
    const otp = this.generateOtp();
    const otpHash = await this.hashOtp(otp);
    const requestedAt = new Date();
    const expiresAt = new Date(requestedAt.getTime() + AuthService.OTP_TTL_MS);

    await this.usersService.setTwoFactorOtp(user.id, otpHash, expiresAt, requestedAt);
    await this.sendLoginOtpEmail(user.email, otp);

    return this.createPendingOtpToken(user, rememberMe);
  }

  getPasswordPolicy() {
    return this.passwordPolicyService.getPolicy();
  }

  updatePasswordPolicy(body: { passwordExpiryDays?: number; warnBeforeExpiryDays?: number }) {
    return this.passwordPolicyService.updatePolicy(body);
  }

  async getPasswordRotationStatus(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.passwordPolicyService.getRotationStatus(user);
  }

  async getLastLogins() {
    const logins = await this.usersService.getAllLastLogins();
    return { logins };
  }

  private async syncLastLoginToUserService(userId: string, lastLogin: Date) {
    try {
      const axios = require('axios');
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
      await axios.put(`${userServiceUrl}/users/${userId}/last-login`, {
        lastLogin: lastLogin.toISOString(),
      });
    } catch (error: any) {
      console.error(
        'Failed to sync last login to user-service:',
        error?.response?.data?.message || error?.message,
      );
    }
  }

  private async sendLoginOtpEmail(email: string, otp: string) {
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const response = await fetch(`${notificationServiceUrl}/email/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        otp,
        expiresInMinutes: Math.floor(AuthService.OTP_TTL_MS / 60000),
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      throw new BadRequestException(
        data?.error || data?.message || 'Failed to send OTP email',
      );
    }
  }

  async checkEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return {
        exists: false,
        requiresVerification: true,
        message: 'User not found',
      };
    }

    if (user.verificationStatus === 'PENDING') {
      return {
        exists: true,
        requiresVerification: true,
        message: 'Email verification required',
      };
    }

    if (user.verificationStatus === 'DUMMY') {
      return {
        exists: true,
        requiresVerification: false,
        message: 'Direct login available',
      };
    }

    return {
      exists: true,
      requiresVerification: false,
      message: 'User verified',
    };
  }

  async initiateEmailVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.usersService.setVerificationToken(email, token, expiresAt);

    // Emit Kafka event for email verification
    this.kafkaClient.emit('email.verification.initiated', {
      userId: user.id,
      email: user.email,
      verificationToken: token,
      expiresAt: expiresAt.toISOString(),
    }).toPromise();

    // In a real implementation, you would send an email here
    // For now, we'll return the token for testing
    return {
      message: 'Verification email sent',
      verificationToken: token, // Only for testing
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const current = currentPassword?.trim() ?? '';
    const next = newPassword?.trim() ?? '';

    if (!current || !next) {
      throw new BadRequestException('Current password and new password are required');
    }

    assertPasswordValid(next);

    const user = await this.usersService.findOne(userId);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Require correct current password before allowing any change
    const isCurrentValid = await bcrypt.compare(current, user.passwordHash);
    if (!isCurrentValid) {
      throw new ForbiddenException({
        message: 'Current password is incorrect',
        code: 'CURRENT_PASSWORD_INVALID',
      });
    }

    if (current === next) {
      throw new BadRequestException('New password must be different from the current password');
    }

    await this.usersService.setPassword(user.id, next);
    await this.sessionsService.revokeRefreshTokensForUser(user.id);

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(token: string, password: string) {
    assertPasswordValid(password);

    const user = await this.usersService.verifyEmail(token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.usersService.setPassword(user.id, password);

    // Emit Kafka event for successful email verification
    this.kafkaClient.emit('email.verification.completed', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    }).toPromise();

    return {
      message: 'Email verified and password set successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const token = await this.sessionsService.findRefreshToken(refreshToken);
    
    if (!token || token.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findOne(token.userId);
    
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    // Create new session
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 1);

    await this.sessionsService.createSession({
      userId: user.id,
      token: accessToken,
      expiresAt: sessionExpiresAt,
    });

    return {
      access_token: accessToken,
    };
  }

  async logout(refreshToken: string) {
    await this.sessionsService.revokeRefreshToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async checkSetup() {
    const allUsers = await this.usersService.findAll();
    return {
      isSetup: allUsers.length > 0,
      userCount: allUsers.length,
    };
  }

  async setupAdmin(email: string, password: string, organizationName: string) {
    // Check if setup is already done
    const setupStatus = await this.checkSetup();
    if (setupStatus.isSetup) {
      throw new UnauthorizedException('System is already set up');
    }

    assertPasswordValid(password);

    // Create the admin user with Company Admin role
    const adminUser = await this.usersService.create({
      email,
      password, // Pass password, not passwordHash - create method will hash it
      verificationStatus: 'VERIFIED',
      isAdmin: true,
    });

    // Emit Kafka event for admin creation
    if (this.kafkaClient) {
      this.kafkaClient.emit('admin.created', {
        userId: adminUser.id,
        email: adminUser.email,
        organizationName,
        timestamp: new Date().toISOString(),
      }).toPromise().catch(err => console.error('Kafka emit error (non-blocking):', err.message));
    }

    return {
      message: 'Admin setup completed successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
      },
      organizationName,
    };
  }

  async deleteUser(userId: string) {
    // Delete user from auth-service database
    await this.usersService.remove(userId);
    
    // Also delete from user-service database
    try {
      const axios = require('axios');
      await axios.delete(`http://localhost:3002/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user from user-service:', error.message);
    }
    
    return { message: 'User deleted successfully from both databases' };
  }

  async createUser(createUserDto: { id: string; email: string; password: string; verificationStatus: string }) {
    assertPasswordValid(createUserDto.password);

    // Create user in auth-service database
    const user = await this.usersService.create({
      id: createUserDto.id,
      email: createUserDto.email,
      password: createUserDto.password,
      verificationStatus: createUserDto.verificationStatus,
    });
    
    return {
      message: 'User created successfully in auth-service database',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
