import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemRole, ScopeLevel } from '../system-roles/system-role.entity';
import { Feature } from '../features/feature.entity';
import { RoleFeaturePermission } from '../role-feature-permissions/role-feature-permission.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemRole, 'user')
    private systemRolesRepository: Repository<SystemRole>,
    @InjectRepository(Feature, 'user')
    private featuresRepository: Repository<Feature>,
    @InjectRepository(RoleFeaturePermission, 'user')
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
        name: 'asset_view',
        displayName: 'View Assets',
        category: 'asset',
        description: 'View asset registers and details',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_delete',
        displayName: 'Delete Assets',
        category: 'asset',
        description: 'Delete assets',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_transfer',
        displayName: 'Transfer Asset Ownership',
        category: 'asset',
        description: 'Transfer asset ownership between users',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_publish',
        displayName: 'Publish Asset Tables',
        category: 'asset',
        description: 'Publish and archive asset tables',
        requiresCreatorAccess: true,
      },
      {
        name: 'asset_import',
        displayName: 'Bulk Import Assets',
        category: 'asset',
        description: 'Bulk upload assets from Excel',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_ticket',
        displayName: 'Create Tickets from Assets',
        category: 'asset',
        description: 'Create issue tickets from asset records',
        requiresCreatorAccess: false,
      },
      {
        name: 'asset_report',
        displayName: 'Asset Reports',
        category: 'asset',
        description: 'Access asset reports and PDF exports',
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
      {
        name: 'learning_view',
        displayName: 'View Learning',
        category: 'learning',
        description: 'Access learning content and courses',
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
    /** Taqtics role → feature names (role-to-permission mapping defaults). */
    const roleFeatureNames: Record<string, string[]> = {
      company_admin: [
        'user_create', 'user_edit', 'user_delete', 'user_view',
        'designation_create', 'designation_edit',
        'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
        'reporting_dashboard', 'reporting_export',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view', 'asset_delete',
        'asset_transfer', 'asset_publish', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      non_creator_company_admin: [
        'user_create', 'user_edit', 'user_delete', 'user_view',
        'designation_create', 'designation_edit',
        'workflow_view', 'workflow_execute',
        'reporting_dashboard', 'reporting_export',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view', 'asset_delete',
        'asset_transfer', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      area_manager: [
        'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
        'reporting_dashboard', 'reporting_export',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view',
        'asset_transfer', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      non_creator_area_manager: [
        'workflow_view', 'workflow_execute',
        'reporting_dashboard', 'reporting_export',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view',
        'asset_transfer', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      process_manager: [
        'workflow_view', 'workflow_execute',
        'reporting_dashboard',
        'ticket_resolve',
        'learning_view',
      ],
      user_manager: [
        'user_create', 'user_edit', 'user_delete', 'user_view',
        'designation_create', 'designation_edit',
        'reporting_dashboard',
      ],
      store_manager: [
        'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
        'reporting_dashboard',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view',
        'asset_transfer', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      non_creator_store_manager: [
        'workflow_view', 'workflow_execute',
        'reporting_dashboard',
        'ticket_create', 'ticket_resolve',
        'asset_create', 'asset_edit', 'asset_view',
        'asset_transfer', 'asset_import', 'asset_ticket', 'asset_report',
        'learning_view',
      ],
      store_employee: ['workflow_execute', 'learning_view'],
      non_creator_store_employee: ['workflow_execute', 'learning_view'],
    };

    const features = await this.featuresRepository.find();
    const featureByName = new Map(features.map((f) => [f.name, f]));

    for (const [roleName, featureNames] of Object.entries(roleFeatureNames)) {
      const role = await this.systemRolesRepository.findOne({ where: { name: roleName } });
      if (!role) continue;

      for (const featureName of featureNames) {
        const feature = featureByName.get(featureName);
        if (!feature) continue;

        const exists = await this.roleFeaturePermissionsRepository.findOne({
          where: { roleId: role.id, featureId: feature.id },
        });
        if (exists) continue;

        const permissionLevel =
          roleName === 'company_admin'
            ? 'admin'
            : featureName.includes('delete')
              ? 'delete'
              : featureName.includes('create') || featureName.includes('edit') || featureName === 'workflow_execute'
                ? 'write'
                : 'read';

        await this.roleFeaturePermissionsRepository.save({
          roleId: role.id,
          featureId: feature.id,
          permissionLevel,
        });
      }
      console.log(`Seeded permissions for ${role.displayName || roleName}`);
    }
  }
}
