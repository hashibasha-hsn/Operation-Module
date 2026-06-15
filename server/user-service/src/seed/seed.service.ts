import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemRole, ScopeLevel } from '../system-roles/system-role.entity';
import { Feature } from '../features/feature.entity';
import { RoleFeaturePermission } from '../role-feature-permissions/role-feature-permission.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemRole)
    private systemRolesRepository: Repository<SystemRole>,
    @InjectRepository(Feature)
    private featuresRepository: Repository<Feature>,
    @InjectRepository(RoleFeaturePermission)
    private roleFeaturePermissionsRepository: Repository<RoleFeaturePermission>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
    await this.seedFeatures();
    await this.seedRoleFeaturePermissions();
  }

  private async seedSystemRoles() {
    const roles = [
      {
        name: 'company_admin',
        displayName: 'Company Admin',
        description: 'Full organization-wide access with creator privileges',
        scopeLevel: ScopeLevel.ORG,
        hasCreatorAccess: true,
      },
      {
        name: 'non_creator_company_admin',
        displayName: 'Non-Creator Company Admin',
        description: 'Full organization-wide access without creator privileges',
        scopeLevel: ScopeLevel.ORG,
        hasCreatorAccess: false,
      },
      {
        name: 'area_manager',
        displayName: 'Area Manager',
        description: 'Regional scope with creator privileges',
        scopeLevel: ScopeLevel.REGIONAL,
        hasCreatorAccess: true,
      },
      {
        name: 'non_creator_area_manager',
        displayName: 'Non-Creator Area Manager',
        description: 'Regional scope without creator privileges',
        scopeLevel: ScopeLevel.REGIONAL,
        hasCreatorAccess: false,
      },
      {
        name: 'process_manager',
        displayName: 'Process Manager',
        description: 'Specific process management with creator privileges',
        scopeLevel: ScopeLevel.REGIONAL,
        hasCreatorAccess: true,
      },
      {
        name: 'user_manager',
        displayName: 'User Manager',
        description: 'User oversight and management',
        scopeLevel: ScopeLevel.REGIONAL,
        hasCreatorAccess: false,
      },
      {
        name: 'store_manager',
        displayName: 'Store Manager',
        description: 'Store-level scope with creator privileges',
        scopeLevel: ScopeLevel.STORE,
        hasCreatorAccess: true,
      },
      {
        name: 'non_creator_store_manager',
        displayName: 'Non-Creator Store Manager',
        description: 'Store-level scope without creator privileges',
        scopeLevel: ScopeLevel.STORE,
        hasCreatorAccess: false,
      },
      {
        name: 'store_employee',
        displayName: 'Store Employee',
        description: 'Task execution only',
        scopeLevel: ScopeLevel.TASK,
        hasCreatorAccess: false,
      },
    ];

    for (const role of roles) {
      const exists = await this.systemRolesRepository.findOne({ where: { name: role.name } });
      if (!exists) {
        await this.systemRolesRepository.save(role);
        console.log(`Seeded system role: ${role.name}`);
      }
    }
  }

  private async seedFeatures() {
    const features = [
      {
        name: 'workflow_create',
        displayName: 'Create Workflows',
        category: 'workflow',
        description: 'Create and design workflows',
        requiresCreatorAccess: true,
      },
      {
        name: 'workflow_edit',
        displayName: 'Edit Workflows',
        category: 'workflow',
        description: 'Edit existing workflows',
        requiresCreatorAccess: true,
      },
      {
        name: 'workflow_execute',
        displayName: 'Execute Workflows',
        category: 'workflow',
        description: 'Execute assigned workflows',
        requiresCreatorAccess: false,
      },
      {
        name: 'workflow_view',
        displayName: 'View Workflows',
        category: 'workflow',
        description: 'View workflows',
        requiresCreatorAccess: false,
      },
      {
        name: 'user_create',
        displayName: 'Create Users',
        category: 'user',
        description: 'Create new users',
        requiresCreatorAccess: false,
      },
      {
        name: 'user_edit',
        displayName: 'Edit Users',
        category: 'user',
        description: 'Edit user details',
        requiresCreatorAccess: false,
      },
      {
        name: 'user_delete',
        displayName: 'Delete Users',
        category: 'user',
        description: 'Delete users',
        requiresCreatorAccess: false,
      },
      {
        name: 'user_view',
        displayName: 'View Users',
        category: 'user',
        description: 'View user list',
        requiresCreatorAccess: false,
      },
      {
        name: 'designation_create',
        displayName: 'Create Designations',
        category: 'user',
        description: 'Create new designations',
        requiresCreatorAccess: false,
      },
      {
        name: 'designation_edit',
        displayName: 'Edit Designations',
        category: 'user',
        description: 'Edit designations',
        requiresCreatorAccess: false,
      },
      {
        name: 'reporting_dashboard',
        displayName: 'Reporting Dashboard',
        category: 'reporting',
        description: 'Access BI dashboards',
        requiresCreatorAccess: false,
      },
      {
        name: 'reporting_export',
        displayName: 'Export Reports',
        category: 'reporting',
        description: 'Export reports',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_create',
        displayName: 'Create Assets',
        category: 'asset',
        description: 'Create new assets',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_edit',
        displayName: 'Edit Assets',
        category: 'asset',
        description: 'Edit assets',
        requiresCreatorAccess: false,
      },
      {
        name: 'ticket_create',
        displayName: 'Create Tickets',
        category: 'ticket',
        description: 'Create issue tickets',
        requiresCreatorAccess: false,
      },
      {
        name: 'ticket_resolve',
        displayName: 'Resolve Tickets',
        category: 'ticket',
        description: 'Resolve issue tickets',
        requiresCreatorAccess: false,
      },
    ];

    for (const feature of features) {
      const exists = await this.featuresRepository.findOne({ where: { name: feature.name } });
      if (!exists) {
        await this.featuresRepository.save(feature);
        console.log(`Seeded feature: ${feature.name}`);
      }
    }
  }

  private async seedRoleFeaturePermissions() {
    const companyAdmin = await this.systemRolesRepository.findOne({ where: { name: 'company_admin' } });
    const areaManager = await this.systemRolesRepository.findOne({ where: { name: 'area_manager' } });
    const storeManager = await this.systemRolesRepository.findOne({ where: { name: 'store_manager' } });
    const storeEmployee = await this.systemRolesRepository.findOne({ where: { name: 'store_employee' } });

    const features = await this.featuresRepository.find();

    // Grant full access to Company Admin
    if (companyAdmin) {
      for (const feature of features) {
        const exists = await this.roleFeaturePermissionsRepository.findOne({
          where: { roleId: companyAdmin.id, featureId: feature.id },
        });
        if (!exists) {
          await this.roleFeaturePermissionsRepository.save({
            roleId: companyAdmin.id,
            featureId: feature.id,
            permissionLevel: 'admin',
          });
        }
      }
      console.log('Seeded permissions for Company Admin');
    }

    // Grant regional access to Area Manager
    if (areaManager) {
      for (const feature of features) {
        const exists = await this.roleFeaturePermissionsRepository.findOne({
          where: { roleId: areaManager.id, featureId: feature.id },
        });
        if (!exists) {
          let permissionLevel = 'read';
          if (feature.category === 'workflow' || feature.category === 'reporting') {
            permissionLevel = 'write';
          }
          await this.roleFeaturePermissionsRepository.save({
            roleId: areaManager.id,
            featureId: feature.id,
            permissionLevel,
          });
        }
      }
      console.log('Seeded permissions for Area Manager');
    }

    // Grant store-level access to Store Manager
    if (storeManager) {
      for (const feature of features) {
        const exists = await this.roleFeaturePermissionsRepository.findOne({
          where: { roleId: storeManager.id, featureId: feature.id },
        });
        if (!exists) {
          let permissionLevel = 'read';
          if (feature.category === 'workflow') {
            permissionLevel = 'write';
          }
          await this.roleFeaturePermissionsRepository.save({
            roleId: storeManager.id,
            featureId: feature.id,
            permissionLevel,
          });
        }
      }
      console.log('Seeded permissions for Store Manager');
    }

    // Grant task execution only to Store Employee
    if (storeEmployee) {
      for (const feature of features) {
        const exists = await this.roleFeaturePermissionsRepository.findOne({
          where: { roleId: storeEmployee.id, featureId: feature.id },
        });
        if (!exists) {
          let permissionLevel = 'read';
          if (feature.name === 'workflow_execute') {
            permissionLevel = 'write';
          }
          await this.roleFeaturePermissionsRepository.save({
            roleId: storeEmployee.id,
            featureId: feature.id,
            permissionLevel,
          });
        }
      }
      console.log('Seeded permissions for Store Employee');
    }
  }
}
