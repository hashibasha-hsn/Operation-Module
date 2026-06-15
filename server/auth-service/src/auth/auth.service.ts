import { Injectable, UnauthorizedException, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    @Optional() @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientProxy,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // First check auth service database
    let user = await this.usersService.findByEmail(email);
    
    // If not found in auth database, check user service and create in auth database
    if (!user) {
      try {
        const axios = require('axios');
        const response = await axios.get(`http://localhost:3002/users?email=${email}`);
        if (response.data && response.data.users && response.data.users.length > 0) {
          const userProfile = response.data.users[0];
          
          // Create the user in auth-service database with plain text password
          // The create method will hash it automatically
          user = await this.usersService.create({
            id: userProfile.userId,
            email: userProfile.email,
            password: userProfile.password, // Pass plain text password
            verificationStatus: 'VERIFIED',
          });
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

  async login(user: any, ipAddress?: string, userAgent?: string) {
    await this.usersService.updateLastLogin(user.id);

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

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

    // Create refresh token
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

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

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        verificationStatus: user.verificationStatus,
      },
    };
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

  async verifyEmail(token: string, password: string) {
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
