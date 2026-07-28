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
      await axios.post(`${this.baseUrl()}/audit-logs`, payload, { timeout: 3000 });
    } catch (error: any) {
      console.error('Failed to write audit log:', error?.message || error);
    }
  }

  async resolveEmail(userId: string): Promise<string> {
    if (!userId) return 'unknown@hashibasha.com';
    if (userId.includes('@')) return userId;
    try {
      const axios = require('axios');
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${userServiceUrl}/users/${userId}`, { timeout: 3000 });
      return response.data?.email || userId;
    } catch {
      return userId;
    }
  }
}
