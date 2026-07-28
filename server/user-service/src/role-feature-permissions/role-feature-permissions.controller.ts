import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import {
  PermissionAuditActor,
  RoleFeaturePermissionsService,
} from './role-feature-permissions.service';
import { RoleFeaturePermission } from './role-feature-permission.entity';

function extractActor(body: Record<string, any> = {}): {
  data: Record<string, any>;
  actor: PermissionAuditActor;
} {
  const {
    performedBy,
    source,
    designationId,
    designationName,
    ...data
  } = body;
  return {
    data,
    actor: {
      performedBy,
      source,
      designationId,
      designationName,
    },
  };
}

@Controller('role-feature-permissions')
export class RoleFeaturePermissionsController {
  constructor(private readonly roleFeaturePermissionsService: RoleFeaturePermissionsService) {}

  @Post()
  create(@Body() createPermissionDto: Partial<RoleFeaturePermission> & PermissionAuditActor) {
    const { data, actor } = extractActor(createPermissionDto as any);
    return this.roleFeaturePermissionsService.create(data, actor);
  }

  @Post('sync')
  syncRolePermissions(
    @Body()
    body: {
      roleId: string;
      grants: { featureId: string; permissionLevel?: string }[];
      performedBy?: string;
      source?: string;
      designationId?: string;
      designationName?: string;
    },
  ) {
    const { data, actor } = extractActor(body as any);
    return this.roleFeaturePermissionsService.syncRolePermissions(
      data.roleId,
      data.grants || [],
      actor,
    );
  }

  @Get()
  findAll() {
    return this.roleFeaturePermissionsService.findAll();
  }

  @Get('role/:roleId')
  findByRoleId(@Param('roleId') roleId: string) {
    return this.roleFeaturePermissionsService.findByRoleId(roleId);
  }

  @Get('feature/:featureId')
  findByFeatureId(@Param('featureId') featureId: string) {
    return this.roleFeaturePermissionsService.findByFeatureId(featureId);
  }

  @Get('check')
  checkPermission(
    @Query('roleId') roleId: string,
    @Query('featureName') featureName: string,
    @Query('requiredLevel') requiredLevel: string,
  ) {
    return this.roleFeaturePermissionsService.checkPermission(
      roleId,
      featureName,
      requiredLevel || 'read',
    );
  }

  @Put(':roleId/:featureId')
  update(
    @Param('roleId') roleId: string,
    @Param('featureId') featureId: string,
    @Body() updatePermissionDto: Partial<RoleFeaturePermission> & PermissionAuditActor,
  ) {
    const { data, actor } = extractActor(updatePermissionDto as any);
    return this.roleFeaturePermissionsService.update(roleId, featureId, data, actor);
  }

  @Delete(':roleId/:featureId')
  remove(
    @Param('roleId') roleId: string,
    @Param('featureId') featureId: string,
    @Query('performedBy') performedBy?: string,
    @Query('source') source?: string,
    @Query('designationId') designationId?: string,
    @Query('designationName') designationName?: string,
  ) {
    return this.roleFeaturePermissionsService.remove(roleId, featureId, {
      performedBy,
      source,
      designationId,
      designationName,
    });
  }
}
