import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);
    return Array.isArray(savedUser) ? savedUser[0] : savedUser;
  }

  async findByEmail(email: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    return await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: normalized })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async getAllLastLogins(): Promise<
    { userId: string; email: string; lastLoginAt: Date | null }[]
  > {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'lastLoginAt'],
    });

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      lastLoginAt: user.lastLoginAt ?? null,
    }));
  }

  async setVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(
      { email },
      { verificationToken: token, verificationTokenExpiresAt: expiresAt }
    );
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token }
    });
    
    if (user && user.verificationTokenExpiresAt && user.verificationTokenExpiresAt > new Date()) {
      await this.userRepository.update(user.id, {
        verificationStatus: 'VERIFIED',
        verificationToken: null,
        verificationTokenExpiresAt: null
      });
      return await this.findOne(user.id);
    }
    
    return null;
  }

  async setPassword(userId: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(userId, { passwordHash: hashedPassword });
    return await this.findOne(userId);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
