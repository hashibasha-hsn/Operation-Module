import type { AuditLogClient } from './audit-log.client';

export const auditLogClientHolder: { client: AuditLogClient | null } = {
  client: null,
};
