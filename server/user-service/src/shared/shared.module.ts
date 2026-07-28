import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AuditLogClient } from './audit-log.client';
import { AuditContextMiddleware } from './audit-context.middleware';
import { auditLogClientHolder } from './audit-log-client.holder';

@Global()
@Module({
  providers: [AuditLogClient, AuditContextMiddleware],
  exports: [AuditLogClient, AuditContextMiddleware],
})
export class SharedModule implements OnModuleInit {
  constructor(private readonly auditLogClient: AuditLogClient) {}

  onModuleInit() {
    auditLogClientHolder.client = this.auditLogClient;
  }
}
