import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || 'http://localhost:3002';

interface AuthUser {
  userId?: string;
  id?: string;
  email?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  private extractUser(req: any): AuthUser | null {
    const header = req?.headers?.['x-user-id'];
    if (typeof header === 'string' && header.trim()) {
      return { userId: header.trim() };
    }

    const auth = req?.headers?.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        return { userId: payload.sub || payload.id || payload.userId, email: payload.email };
      } catch {
        return null;
      }
    }

    const email = req?.headers?.['x-user-email'];
    if (typeof email === 'string' && email.trim()) {
      return { email: email.trim() };
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const actor = this.extractUser(request);

    if (!actor?.userId && !actor?.email) {
      throw new UnauthorizedException('Missing user identity');
    }

    try {
      let profile: any = null;

      if (actor.userId) {
        const res = await fetch(`${USER_SERVICE_URL}/users/${encodeURIComponent(actor.userId)}`);
        if (res.ok) profile = await res.json();
      }

      if (!profile && actor.email) {
        const res = await fetch(
          `${USER_SERVICE_URL}/users?search=${encodeURIComponent(actor.email)}&limit=50`,
        );
        if (res.ok) {
          const data = await res.json();
          profile = (data.users || []).find(
            (u: any) => String(u.email || '').toLowerCase() === String(actor.email).toLowerCase(),
          );
        }
      }

      if (!profile) {
        throw new ForbiddenException('Unable to verify user role');
      }

      const role = String(profile?.role || '').trim();
      if (role !== 'super_admin') {
        this.logger.warn(`Access denied for non-super-admin user ${actor.userId || actor.email}`);
        throw new ForbiddenException('Only a super admin can change email settings');
      }

      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`AdminGuard verification failed: ${error?.message}`);
      throw new ForbiddenException('Unable to verify user role');
    }
  }
}
