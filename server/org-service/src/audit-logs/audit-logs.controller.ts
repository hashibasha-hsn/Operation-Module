import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AuditLogsService, AuditLogQuery } from './audit-logs.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('target') target?: string,
    @Query('operation') operation?: string,
    @Query('performedBy') performedBy?: string,
    @Query('details') details?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    const query: AuditLogQuery = {
      organizationId: organizationId || 'default-org',
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      target,
      operation,
      performedBy,
      details,
      sort,
    };
    return this.auditLogsService.findAll(query);
  }

  @Post()
  create(
    @Body()
    body: {
      target: string;
      operation: string;
      performedBy: string;
      details?: Record<string, unknown>;
      targetId?: string;
      organizationId?: string;
    },
  ) {
    return this.auditLogsService.log(body);
  }
}
