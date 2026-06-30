import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createSession(createSessionDto: any): Promise<Session> {
    const session = this.sessionRepository.create(createSessionDto);
    const savedSession = await this.sessionRepository.save(session);
    return Array.isArray(savedSession) ? savedSession[0] : savedSession;
  }

  async createRefreshToken(createRefreshTokenDto: any): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create(createRefreshTokenDto);
    const savedToken = await this.refreshTokenRepository.save(refreshToken);
    return Array.isArray(savedToken) ? savedToken[0] : savedToken;
  }

  async findSessionByToken(token: string): Promise<Session> {
    return await this.sessionRepository.findOne({ 
      where: { token },
      relations: ['user']
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken> {
    return await this.refreshTokenRepository.findOne({ 
      where: { token },
      relations: ['user']
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  async deleteSession(token: string): Promise<void> {
    await this.sessionRepository.delete({ token });
  }

  async deleteSessionsForUser(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async revokeRefreshTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
