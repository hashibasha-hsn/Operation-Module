import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName, ScopeLevel } from './role.entity';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createRole(createRoleDto: any): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);
    return Array.isArray(savedRole) ? savedRole[0] : savedRole;
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({ relations: ['parentRole', 'childRoles'] });
  }

  async findOne(id: string): Promise<Role> {
    return await this.roleRepository.findOne({ 
      where: { id },
      relations: ['parentRole', 'childRoles']
    });
  }

  async findByName(name: RoleName): Promise<Role> {
    return await this.roleRepository.findOne({ where: { name } });
  }

  async findByHierarchyLevel(level: number): Promise<Role[]> {
    return await this.roleRepository.find({ where: { hierarchyLevel: level } });
  }

  async grantPermission(roleId: string, permissionId: string): Promise<RolePermission> {
    const rolePermission = this.rolePermissionRepository.create({ roleId, permissionId });
    return await this.rolePermissionRepository.save(rolePermission);
  }

  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({ roleId, permissionId });
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission']
    });
    return rolePermissions.map(rp => rp.permission);
  }

  async createPermission(createPermissionDto: any): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    const savedPermission = await this.permissionRepository.save(permission);
    return Array.isArray(savedPermission) ? savedPermission[0] : savedPermission;
  }

  async findAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find();
  }

  async initializeTaqticsRoles(): Promise<void> {
    // Initialize Taqtics-style roles if they don't exist
    const roles = [
      { name: RoleName.COMPANY_ADMIN, displayName: 'Company Admin', hierarchyLevel: 1, scopeLevel: ScopeLevel.ORG_WIDE, isCreator: true, description: 'Full organization-wide access with creator privileges' },
      { name: RoleName.AREA_MANAGER, displayName: 'Area Manager', hierarchyLevel: 2, scopeLevel: ScopeLevel.REGIONAL, isCreator: true, description: 'Regional scope with creator privileges' },
      { name: RoleName.PROCESS_MANAGER, displayName: 'Process Manager', hierarchyLevel: 3, scopeLevel: ScopeLevel.PROCESS_SPECIFIC, isCreator: true, description: 'Specific process scope with creator privileges' },
      { name: RoleName.USER_MANAGER, displayName: 'User Manager', hierarchyLevel: 4, scopeLevel: ScopeLevel.USER_OVERSIGHT, isCreator: true, description: 'User oversight scope with creator privileges' },
      { name: RoleName.STORE_MANAGER, displayName: 'Store Manager', hierarchyLevel: 5, scopeLevel: ScopeLevel.STORE_LEVEL, isCreator: true, description: 'Store-level scope with creator privileges' },
      { name: RoleName.STORE_EMPLOYEE, displayName: 'Store Employee', hierarchyLevel: 6, scopeLevel: ScopeLevel.TASK_LEVEL, isCreator: false, description: 'Task execution only' },
    ];

    for (const roleData of roles) {
      const existing = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!existing) {
        await this.roleRepository.save(roleData);
      }
    }
  }
}
