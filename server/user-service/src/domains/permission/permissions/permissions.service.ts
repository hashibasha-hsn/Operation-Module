import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionCache } from './permission-cache.entity';
import { PermissionAuditLog } from './permission-audit-log.entity';
import { RoleChangeHistory } from './role-change-history.entity';
import { ScopeAccess } from './scope-access.entity';

@Injectable()
export class PermissionsService {
  private readonly userServiceUrl =
    process.env.USER_SERVICE_URL || `http://localhost:${process.env.PORT || 3002}`;

  constructor(
    @InjectRepository(PermissionCache, 'permission')
    private readonly permissionCacheRepository: Repository<PermissionCache>,
    @InjectRepository(PermissionAuditLog, 'permission')
    private readonly auditLogRepository: Repository<PermissionAuditLog>,
    @InjectRepository(RoleChangeHistory, 'permission')
    private readonly roleChangeHistoryRepository: Repository<RoleChangeHistory>,
    @InjectRepository(ScopeAccess, 'permission')
    private readonly scopeAccessRepository: Repository<ScopeAccess>,
  ) {}

  async cachePermissions(userId: string, orgId: string, roleId: string, permissions: any): Promise<PermissionCache> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

    const cache = this.permissionCacheRepository.create({
      userId,
      orgId,
      roleId,
      permissions,
      expiresAt,
    });
    
    return await this.permissionCacheRepository.save(cache);
  }

  async getCachedPermissions(userId: string, orgId: string): Promise<PermissionCache> {
    const cache = await this.permissionCacheRepository.findOne({
      where: { userId, orgId, expiresAt: { $gt: new Date() } as any }
    });
    
    if (cache && cache.expiresAt > new Date()) {
      return cache;
    }
    
    return null;
  }

  async invalidateCache(userId: string, orgId: string): Promise<void> {
    await this.permissionCacheRepository.delete({ userId, orgId });
  }

  async logPermissionChange(logData: any): Promise<PermissionAuditLog> {
    const log = this.auditLogRepository.create(logData);
    const savedLog = await this.auditLogRepository.save(log);
    return Array.isArray(savedLog) ? savedLog[0] : savedLog;
  }

  async logRoleChange(logData: any): Promise<RoleChangeHistory> {
    const history = this.roleChangeHistoryRepository.create(logData);
    const savedHistory = await this.roleChangeHistoryRepository.save(history);
    return Array.isArray(savedHistory) ? savedHistory[0] : savedHistory;
  }

  async getRoleChangeHistory(userId: string, orgId: string): Promise<RoleChangeHistory[]> {
    return await this.roleChangeHistoryRepository.find({
      where: { userId, orgId },
      order: { createdAt: 'DESC' }
    });
  }

  async grantScopeAccess(userId: string, orgId: string, scopeType: string, scopeId: string, permissions: any): Promise<ScopeAccess> {
    const scopeAccess = this.scopeAccessRepository.create({
      userId,
      orgId,
      scopeType,
      scopeId,
      permissions,
    });
    
    return await this.scopeAccessRepository.save(scopeAccess);
  }

  async revokeScopeAccess(userId: string, orgId: string, scopeType: string, scopeId: string): Promise<void> {
    await this.scopeAccessRepository.delete({ userId, orgId, scopeType, scopeId });
  }

  async getUserScopeAccess(userId: string, orgId: string): Promise<ScopeAccess[]> {
    return await this.scopeAccessRepository.find({
      where: { userId, orgId, isActive: true }
    });
  }

  async checkPermission(userId: string, orgId: string, permission: string, scopeId?: string): Promise<boolean> {
    const cached = await this.getCachedPermissions(userId, orgId);
    
    if (cached) {
      const permissions = cached.permissions;
      if (Array.isArray(permissions)) {
        return permissions.includes(permission);
      }
      return permissions[permission] === true;
    }
    
    // If not cached, fetch permissions from user service
    try {
      const response = await fetch(`${this.userServiceUrl}/user-designations/primary/${userId}/${orgId}`);
      const data = await response.json();
      
      if (data) {
        const userDesignation = data;
        const systemRoleId = await this.getSystemRoleForDesignation(userDesignation.designationId);
        
        if (systemRoleId) {
          const permissions = await this.getPermissionsForRole(systemRoleId);
          await this.cachePermissions(userId, orgId, systemRoleId, permissions);
          
          if (Array.isArray(permissions)) {
            return permissions.includes(permission);
          }
          return permissions[permission] === true;
        }
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
    
    return false;
  }

  async checkScopePermission(userId: string, orgId: string, scopeType: string, scopeId: string, permission: string): Promise<boolean> {
    const scopeAccess = await this.scopeAccessRepository.findOne({
      where: { userId, orgId, scopeType, scopeId, isActive: true }
    });
    
    if (!scopeAccess) {
      return false;
    }
    
    const permissions = scopeAccess.permissions;
    if (Array.isArray(permissions)) {
      return permissions.includes(permission);
    }
    return permissions[permission] === true;
  }

  async checkFeaturePermission(userId: string, orgId: string, featureName: string, requiredLevel: string): Promise<boolean> {
    try {
      // Get user's designation
      const designationResponse = await fetch(`${this.userServiceUrl}/user-designations/primary/${userId}/${orgId}`);
      const userDesignation = await designationResponse.json();
      
      if (!userDesignation) {
        return false;
      }
      
      // Get system role for designation
      const mappingResponse = await fetch(`${this.userServiceUrl}/designation-role-mapping/system-role/${userDesignation.designationId}`);
      const systemRoleId = await mappingResponse.json();
      
      if (!systemRoleId) {
        return false;
      }
      
      // Check if role has permission for feature
      const permissionResponse = await fetch(`${this.userServiceUrl}/role-feature-permissions/check?roleId=${systemRoleId}&featureName=${featureName}&requiredLevel=${requiredLevel}`);
      const hasPermission = await permissionResponse.json();
      
      return hasPermission || false;
    } catch (error) {
      console.error('Error checking feature permission:', error);
      return false;
    }
  }

  private async getSystemRoleForDesignation(designationId: string): Promise<string> {
    try {
      const response = await fetch(`${this.userServiceUrl}/designation-role-mapping/system-role/${designationId}`);
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error getting system role for designation:', error);
      return null;
    }
  }

  private async getPermissionsForRole(roleId: string): Promise<any> {
    try {
      const response = await fetch(`${this.userServiceUrl}/role-feature-permissions/role/${roleId}`);
      const data = await response.json();
      
      if (data) {
        const permissions = {};
        data.forEach((rp: any) => {
          permissions[rp.feature.name] = rp.permissionLevel;
        });
        return permissions;
      }
      return {};
    } catch (error) {
      console.error('Error getting permissions for role:', error);
      return {};
    }
  }
}
