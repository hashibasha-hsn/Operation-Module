import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleFeaturePermission } from './role-feature-permission.entity';

export type PermissionAuditActor = {
  performedBy?: string;
  source?: string;
  designationId?: string;
  designationName?: string;
};

@Injectable()
export class RoleFeaturePermissionsService {
  constructor(
    @InjectRepository(RoleFeaturePermission, 'user')
    private roleFeaturePermissionsRepository: Repository<RoleFeaturePermission>,
  ) {}

  private async writeAuditLog(payload: {
    target: string;
    operation: string;
    performedBy: string;
    details?: Record<string, unknown>;
    targetId?: string;
  }) {
    try {
      const axios = require('axios');
      const auditLogServiceUrl =
        process.env.AUDIT_LOG_SERVICE_URL || 'http://localhost:3015';
      await axios.post(
        `${auditLogServiceUrl}/audit-logs`,
        { ...payload, organizationId: 'default-org' },
        { timeout: 3000 },
      );
    } catch (error: any) {
      console.error('Failed to write permission audit log:', error?.message || error);
    }
  }

  private actorLabel(actor?: PermissionAuditActor) {
    return (actor?.performedBy || 'system').trim() || 'system';
  }

  private baseAuditDetails(
    permission: RoleFeaturePermission | null | undefined,
    actor?: PermissionAuditActor,
    extra?: Record<string, unknown>,
  ) {
    return {
      roleId: permission?.roleId,
      roleName: permission?.role?.name || permission?.role?.displayName,
      featureId: permission?.featureId,
      featureName: permission?.feature?.name || permission?.feature?.displayName,
      permissionLevel: permission?.permissionLevel,
      source: actor?.source || 'api',
      designationId: actor?.designationId,
      designationName: actor?.designationName,
      ...extra,
    };
  }

  /** Create or update a role→feature permission mapping (idempotent). */
  async create(
    permissionData: Partial<RoleFeaturePermission>,
    actor?: PermissionAuditActor,
    options?: { skipAudit?: boolean },
  ): Promise<RoleFeaturePermission> {
    if (!permissionData.roleId || !permissionData.featureId) {
      throw new BadRequestException('roleId and featureId are required');
    }

    const existing = await this.findOne(permissionData.roleId, permissionData.featureId);
    if (existing) {
      const prevLevel = existing.permissionLevel;
      const nextLevel = permissionData.permissionLevel || existing.permissionLevel || 'read';
      if (prevLevel !== nextLevel) {
        await this.roleFeaturePermissionsRepository.update(existing.id, {
          permissionLevel: nextLevel,
        });
      }
      const updated = await this.findOne(permissionData.roleId, permissionData.featureId);
      if (!options?.skipAudit && prevLevel !== nextLevel) {
        await this.writeAuditLog({
          target: 'FeaturePermission',
          operation: 'Update',
          performedBy: this.actorLabel(actor),
          targetId: updated?.id || existing.id,
          details: this.baseAuditDetails(updated || existing, actor, {
            previousPermissionLevel: prevLevel,
            action: 'permission_level_changed',
          }),
        });
      }
      return updated;
    }

    const permission = this.roleFeaturePermissionsRepository.create({
      roleId: permissionData.roleId,
      featureId: permissionData.featureId,
      permissionLevel: permissionData.permissionLevel || 'read',
      grantedAt: permissionData.grantedAt || new Date(),
    });
    await this.roleFeaturePermissionsRepository.save(permission);
    const saved = await this.findOne(permissionData.roleId, permissionData.featureId);

    if (!options?.skipAudit) {
      await this.writeAuditLog({
        target: 'FeaturePermission',
        operation: 'Grant',
        performedBy: this.actorLabel(actor),
        targetId: saved?.id || permission.id,
        details: this.baseAuditDetails(saved || (permission as RoleFeaturePermission), actor, {
          action: 'permission_granted',
        }),
      });
    }

    return saved;
  }

  /**
   * Replace permissions for a role with the given feature grants.
   * Features not listed are removed (full sync for that role).
   */
  async syncRolePermissions(
    roleId: string,
    grants: { featureId: string; permissionLevel?: string }[],
    actor?: PermissionAuditActor,
  ): Promise<RoleFeaturePermission[]> {
    if (!roleId) {
      throw new BadRequestException('roleId is required');
    }

    const existing = await this.findByRoleId(roleId);
    const beforeFeatureIds = new Set(existing.map((row) => row.featureId));
    const nextFeatureIds = new Set((grants || []).map((g) => g.featureId).filter(Boolean));

    const removedFeatureIds: string[] = [];
    const removedFeatureNames: string[] = [];
    for (const row of existing) {
      if (!nextFeatureIds.has(row.featureId)) {
        removedFeatureIds.push(row.featureId);
        removedFeatureNames.push(row.feature?.name || row.featureId);
        await this.roleFeaturePermissionsRepository.delete(row.id);
      }
    }

    const addedFeatureIds: string[] = [];
    for (const grant of grants || []) {
      if (!grant.featureId) continue;
      const isNew = !beforeFeatureIds.has(grant.featureId);
      await this.create(
        {
          roleId,
          featureId: grant.featureId,
          permissionLevel: grant.permissionLevel || 'read',
        },
        actor,
        { skipAudit: true },
      );
      if (isNew) {
        addedFeatureIds.push(grant.featureId);
      }
    }

    // For new grants we skipped actor so create didn't audit — collect names after sync
    const after = await this.findByRoleId(roleId);
    const addedNames = after
      .filter((row) => addedFeatureIds.includes(row.featureId))
      .map((row) => row.feature?.name || row.featureId);

    const roleName = after[0]?.role?.name || existing[0]?.role?.name || roleId;

    if (addedFeatureIds.length > 0 || removedFeatureIds.length > 0) {
      await this.writeAuditLog({
        target: 'FeaturePermission',
        operation: 'Sync',
        performedBy: this.actorLabel(actor),
        targetId: roleId,
        details: {
          roleId,
          roleName,
          action: 'permission_matrix_sync',
          source: actor?.source || 'feature_permissions_matrix',
          designationId: actor?.designationId,
          designationName: actor?.designationName,
          grantedCount: addedFeatureIds.length,
          revokedCount: removedFeatureIds.length,
          grantedFeatures: addedNames,
          revokedFeatures: removedFeatureNames,
          totalFeaturesAfter: after.length,
        },
      });
    }

    return after;
  }

  async findAll(): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      relations: ['role', 'feature'],
    });
  }

  async findByRoleId(roleId: string): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      where: { roleId },
      relations: ['feature', 'role'],
    });
  }

  async findByFeatureId(featureId: string): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      where: { featureId },
      relations: ['role'],
    });
  }

  async findOne(roleId: string, featureId: string): Promise<RoleFeaturePermission> {
    return await this.roleFeaturePermissionsRepository.findOne({
      where: { roleId, featureId },
      relations: ['role', 'feature'],
    });
  }

  async update(
    roleId: string,
    featureId: string,
    permissionData: Partial<RoleFeaturePermission>,
    actor?: PermissionAuditActor,
  ): Promise<RoleFeaturePermission> {
    const permission = await this.findOne(roleId, featureId);
    if (!permission) return null;

    const { performedBy: _pb, ...safeData } = permissionData as any;
    const prevLevel = permission.permissionLevel;
    await this.roleFeaturePermissionsRepository.update(permission.id, safeData);
    const updated = await this.findOne(roleId, featureId);

    await this.writeAuditLog({
      target: 'FeaturePermission',
      operation: 'Update',
      performedBy: this.actorLabel(actor),
      targetId: updated?.id || permission.id,
      details: this.baseAuditDetails(updated || permission, actor, {
        previousPermissionLevel: prevLevel,
        action: 'permission_updated',
      }),
    });

    return updated;
  }

  async remove(
    roleId: string,
    featureId: string,
    actor?: PermissionAuditActor,
  ): Promise<void> {
    const permission = await this.findOne(roleId, featureId);
    if (!permission) return;

    await this.roleFeaturePermissionsRepository.delete(permission.id);

    await this.writeAuditLog({
      target: 'FeaturePermission',
      operation: 'Revoke',
      performedBy: this.actorLabel(actor),
      targetId: permission.id,
      details: this.baseAuditDetails(permission, actor, {
        action: 'permission_revoked',
      }),
    });
  }

  async checkPermission(
    roleId: string,
    featureName: string,
    requiredLevel = 'read',
  ): Promise<boolean> {
    if (!roleId || !featureName) return false;

    const permission = await this.roleFeaturePermissionsRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.feature', 'feature')
      .where('permission.roleId = :roleId', { roleId })
      .andWhere('feature.name = :featureName', { featureName })
      .getOne();

    if (!permission) return false;

    const permissionLevels = ['read', 'write', 'delete', 'admin'];
    const requiredIndex = permissionLevels.indexOf(requiredLevel || 'read');
    const currentLevel = permissionLevels.indexOf(permission.permissionLevel || 'read');
    if (requiredIndex < 0) return true;
    if (currentLevel < 0) return false;
    return currentLevel >= requiredIndex;
  }
}
