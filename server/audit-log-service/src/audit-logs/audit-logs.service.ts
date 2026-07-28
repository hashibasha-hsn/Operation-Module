import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export type AuditLogQuery = {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  target?: string;
  operation?: string;
  performedBy?: string;
  details?: string;
  sort?: 'asc' | 'desc';
  category?: 'workflow' | 'system';
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog, 'org')
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(payload: {
    target: string;
    operation: string;
    performedBy: string;
    details?: Record<string, unknown>;
    targetId?: string;
    organizationId?: string;
  }): Promise<AuditLog> {
    const entry = this.auditLogsRepository.create({
      target: payload.target,
      operation: payload.operation,
      performedBy: payload.performedBy,
      details: payload.details ?? {},
      targetId: payload.targetId,
      organizationId: payload.organizationId ?? 'default-org',
    });
    return this.auditLogsRepository.save(entry);
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

  async findAll(query: AuditLogQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const organizationId = query.organizationId || 'default-org';
    const qb = this.auditLogsRepository.createQueryBuilder('log');
    // Single-tenant installs often mix real org UUIDs with 'default-org' writers.
    if (organizationId === 'default-org') {
      qb.where('log.organizationId = :organizationId', { organizationId });
    } else {
      qb.where('(log.organizationId = :organizationId OR log.organizationId = :defaultOrg)', {
        organizationId,
        defaultOrg: 'default-org',
      });
    }

    if (query.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(`${query.startDate}T00:00:00.000Z`),
      });
    }
    if (query.endDate) {
      qb.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(`${query.endDate}T23:59:59.999Z`),
      });
    }
    if (query.target?.trim()) {
      qb.andWhere('log.target ILIKE :target', { target: `%${query.target.trim()}%` });
    }
    if (query.operation?.trim()) {
      qb.andWhere('log.operation ILIKE :operation', {
        operation: `%${query.operation.trim()}%`,
      });
    }
    if (query.performedBy?.trim()) {
      qb.andWhere('log.performedBy ILIKE :performedBy', {
        performedBy: `%${query.performedBy.trim()}%`,
      });
    }
    if (query.details?.trim()) {
      qb.andWhere('CAST(log.details AS TEXT) ILIKE :details', {
        details: `%${query.details.trim()}%`,
      });
    }
    if (query.category === 'workflow') {
      qb.andWhere(
        `(
          log.target IN (:...workflowTargets)
          OR log.target ILIKE :formTarget
          OR (log.details->>'workflowType' = 'process' OR log.details->>'workflowType' = 'audit')
        )`,
        {
          workflowTargets: ['Process', 'Audit'],
          formTarget: 'Form Submission%',
        },
      );
    } else if (query.category === 'system') {
      qb.andWhere(
        `(
          log.target NOT IN (:...workflowTargets)
          AND log.target NOT ILIKE :formTarget
        )`,
        {
          workflowTargets: ['Process', 'Audit'],
          formTarget: 'Form Submission%',
        },
      );
    }

    qb.orderBy('log.createdAt', query.sort === 'asc' ? 'ASC' : 'DESC');

    const [logs, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
      hasMore: skip + logs.length < total,
    };
  }
}
