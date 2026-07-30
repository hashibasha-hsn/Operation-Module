import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { auditContext, AuditActor } from './audit-context';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const actor = this.resolveActor(req);
    auditContext.run(actor, () => next());
  }

  private resolveActor(req: Request): AuditActor {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = req.query as Record<string, unknown>;

    const authHeader = pickString(req.headers.authorization);
    let userId = pickString(req.headers['x-user-id']);
    let email = pickString(req.headers['x-user-email']);

    if (authHeader?.startsWith('Bearer ')) {
      const payload = decodeJwtPayload(authHeader.slice(7));
      userId = userId || pickString(payload?.sub) || pickString(payload?.userId) || pickString(payload?.id);
      email = email || pickString(payload?.email);
    }

    userId =
      userId ||
      pickString(body.userId) ||
      pickString(body.performedBy) ||
      pickString(body.createdBy) ||
      pickString(query.userId) ||
      pickString(query.performedBy);

    email = email || pickString(body.email);

    const organizationId =
      pickString(req.headers['x-organization-id']) ||
      pickString(body.organizationId) ||
      pickString(query.organizationId) ||
      this.configService.get<string>('DEFAULT_ORG_ID') ||
      'default-org';

    return {
      userId: userId || email || 'system',
      email,
      organizationId,
    };
  }
}
