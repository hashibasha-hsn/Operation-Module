import { Injectable, UnauthorizedException, Inject, Optional, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/user.entity';
import { UsersService as ProfileUsersService } from '../../../users/users.service';
import { assertPasswordValid } from './password.util';
import { PasswordPolicyService } from './password-policy.service';
import { LoginAttemptService } from '../login-attempts/login-attempts.service';
import { LoginPolicyService } from '../login-attempts/login-policy.service';

@Injectable()
export class AuthService {
  private static readonly OTP_TTL_MS = 10 * 60 * 1000;
  private static readonly OTP_RESEND_COOLDOWN_MS = 30 * 1000;
  private static readonly PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly loginPolicyService: LoginPolicyService,
    @Optional() @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientProxy,
    private readonly profileUsersService: ProfileUsersService,
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

  async validateUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<any> {
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
        const userServiceUrl =
          process.env.USER_SERVICE_URL || `http://localhost:${process.env.PORT || 3002}`;
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
      await this.recordFailedAttempt(normalizedEmail, undefined, 'user_not_found', ipAddress, userAgent);
      return null;
    }

    // Pending accounts (created but not activated) cannot sign in yet.
    if (user.verificationStatus === 'PENDING') {
      await this.recordFailedAttempt(normalizedEmail, user.id, 'pending_account', ipAddress, userAgent);
      throw new UnauthorizedException(
        'Your account is not activated yet. Please click the activation link sent to your email.',
      );
    }

    // For dummy users, check if password matches directly
    if (user.verificationStatus === 'DUMMY') {
      const bcrypt = require('bcrypt');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.recordFailedAttempt(normalizedEmail, user.id, 'invalid_credentials', ipAddress, userAgent);
        return null;
      }
      return user;
    }

    // For verified users, check password
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(normalizedEmail, user.id, 'invalid_credentials', ipAddress, userAgent);
      return null;
    }

    return user;
  }

  private async recordFailedAttempt(
    email: string,
    userId: string | undefined,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.loginAttemptService.record({
        email,
        userId,
        success: false,
        reason,
        ipAddress,
        userAgent,
      });
    } catch (error: any) {
      console.error('Failed to record failed login attempt (non-blocking):', error?.message);
    }
  }

  /**
   * Brute-force guard: block when the same email or IP has too many recent failures.
   * Threshold + lockout duration are driven by the persisted LoginPolicySettings.
   * Returns the remaining lockout minutes when blocked, otherwise 0.
   */
  async isLoginBlocked(email: string, ipAddress?: string): Promise<number> {
    const policy = await this.loginPolicyService.getPolicy();
    const windowMs = policy.lockoutHours * 60 * 60 * 1000;
    const since = new Date(Date.now() - windowMs);
    const maxFailures = policy.maxFailedAttempts;
    const normalized = email?.trim().toLowerCase() ?? '';

    const emailFailures = normalized
      ? await this.loginAttemptService.countFailedForEmail(normalized, since)
      : 0;
    if (emailFailures >= maxFailures) return windowMs;
    if (ipAddress) {
      const ipFailures = await this.loginAttemptService.countFailedForIp(ipAddress, since);
      if (ipFailures >= maxFailures) return windowMs;
    }
    return 0;
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

    // Record successful login attempt for monitoring.
    try {
      await this.loginAttemptService.record({
        email: user.email,
        userId: user.id,
        success: true,
        ipAddress,
        userAgent,
      });
    } catch (error: any) {
      console.error('Failed to record login attempt (non-blocking):', error?.message);
    }

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
      await this.recordFailedAttempt(user.email, user.id, 'otp_expired', ipAddress, userAgent);
      throw new UnauthorizedException('OTP expired');
    }

    const validOtp = await bcrypt.compare(otp?.trim() ?? '', user.twoFactorOtpHash);
    if (!validOtp) {
      await this.recordFailedAttempt(user.email, user.id, 'invalid_otp', ipAddress, userAgent);
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
      const userServiceUrl =
        process.env.USER_SERVICE_URL || `http://localhost:${process.env.PORT || 3002}`;
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

  private async sendPasswordResetEmail(email: string, token: string) {
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const response = await fetch(`${notificationServiceUrl}/email/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, token }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      throw new BadRequestException(
        data?.error || data?.message || 'Failed to send password reset email',
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

  async forgotPassword(email: string) {
    const normalizedEmail = email?.trim().toLowerCase() ?? '';
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);

    // Always return success to avoid leaking whether an account exists.
    if (!user || user.verificationStatus === 'PENDING') {
      return {
        success: true,
        message: 'If an account exists for that email, a reset link has been sent.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + AuthService.PASSWORD_RESET_TTL_MS);

    await this.usersService.setPasswordResetToken(user.id, tokenHash, expiresAt);

    try {
      await this.sendPasswordResetEmail(user.email, token);
    } catch (error: any) {
      console.error('Failed to send password reset email:', error?.message);
    }

    return {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const trimmedToken = token?.trim() ?? '';
    const next = newPassword?.trim() ?? '';

    if (!trimmedToken || !next) {
      throw new BadRequestException('Reset token and new password are required');
    }

    assertPasswordValid(next);

    const tokenHash = crypto.createHash('sha256').update(trimmedToken).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(tokenHash);

    if (!user?.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearPasswordResetToken(user.id);
      throw new UnauthorizedException('This reset link has expired. Please request a new one.');
    }

    await this.usersService.setPassword(user.id, next);
    await this.usersService.clearPasswordResetToken(user.id);
    await this.sessionsService.deleteSessionsForUser(user.id);
    await this.sessionsService.revokeRefreshTokensForUser(user.id);

    return { message: 'Your password has been reset. You can now sign in.' };
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

    // Create the admin user as VERIFIED — the super admin is active immediately
    // and does not need to activate via email.
    const adminUser = await this.usersService.create({
      email,
      password, // Pass password, not passwordHash - create method will hash it
      verificationStatus: 'VERIFIED',
      isAdmin: true,
    });

    // Create the matching user profile (role auto-promotes to super_admin since
    // it is the first profile) so the frontend can resolve role + profile after login.
    const displayName =
      String(organizationName || '').trim() ||
      String(email.split('@')[0] || email).trim();
    try {
      await this.profileUsersService.create({
        userId: adminUser.id,
        email,
        name: displayName,
        isActive: true,
        validEmail: true,
      });
    } catch (error: any) {
      console.error('Failed to create super admin profile:', error?.message);
    }

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

  private async sendAccountActivationEmail(email: string, password: string, token: string) {
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    const response = await fetch(`${notificationServiceUrl}/email/activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        password,
        token,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      throw new BadRequestException(
        data?.error || data?.message || 'Failed to send activation email',
      );
    }
  }

  async activateAccount(token: string) {
    const user = await this.usersService.verifyEmail(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired activation link');
    }

    // Emit Kafka event for successful account activation
    if (this.kafkaClient) {
      this.kafkaClient.emit('account.activated', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      }).toPromise().catch(() => undefined);
    }

    return {
      message: 'Account activated successfully. You can now sign in.',
      user: {
        id: user.id,
        email: user.email,
        verificationStatus: 'VERIFIED',
      },
    };
  }

  async deleteUser(userId: string) {
    // Delete user from auth-service database
    await this.usersService.remove(userId);
    
    // Also delete from user-service database
    try {
      const axios = require('axios');
      const userServiceUrl =
        process.env.USER_SERVICE_URL || `http://localhost:${process.env.PORT || 3002}`;
      await axios.delete(`${userServiceUrl}/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user from user-service:', error.message);
    }
    
    return { message: 'User deleted successfully from both databases' };
  }

  async createUser(createUserDto: { id: string; email: string; password: string; verificationStatus: string }) {
    assertPasswordValid(createUserDto.password);

    const existing = await this.usersService.findByEmail(createUserDto.email);
    if (existing) {
      return {
        message: 'Auth user already exists',
        user: { id: existing.id, email: existing.email },
      };
    }

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
