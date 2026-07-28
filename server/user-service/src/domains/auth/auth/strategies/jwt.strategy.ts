import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    let user = payload?.sub ? await this.usersService.findOne(payload.sub) : null;
    if (!user && payload?.email) {
      user = await this.usersService.findByEmail(payload.email);
    }
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return { id: user.id, email: user.email, verificationStatus: user.verificationStatus };
  }
}
