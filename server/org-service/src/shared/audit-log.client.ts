import { Injectable } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuditLogClient {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async log(payload: {
    target: string;
    operation: string;
    performedBy: string;
    details?: Record<string, unknown>;
    targetId?: string;
    organizationId?: string;
  }): Promise<void> {
    try {
      await this.auditLogsService.log(payload);
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
      const email = response.data?.email || response.data?.data?.email;
      if (email) return email;
      const name = response.data?.name || response.data?.data?.name || response.data?.firstName;
      if (name) return name;
    } catch {}
    return userId;
  }
}
