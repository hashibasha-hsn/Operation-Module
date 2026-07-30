import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogClient {
  private baseUrl(): string {
    return (
      process.env.AUDIT_LOG_SERVICE_URL ||
      process.env.GATEWAY_URL ||
      'http://localhost:3015'
    ).replace(/\/$/, '');
  }

  async log(payload: {
    target: string;
    operation: string;
    performedBy: string;
    details?: Record<string, unknown>;
    targetId?: string;
    organizationId?: string;
  }): Promise<void> {
    try {
      const axios = require('axios');
      const base = this.baseUrl();
      const url = base.endsWith('/audit-logs')
        ? base
        : base.includes(':3015')
          ? `${base}/audit-logs`
          : `${base}/api/audit-logs`;
      await axios.post(url, payload, { timeout: 3000 });
    } catch (error: any) {
      console.error('Failed to write audit log:', error?.message || error);
    }
  }

  async resolveEmail(userId: string): Promise<string> {
    if (!userId) return 'unknown@hashibasha.com';
    return userId;
  }
}
