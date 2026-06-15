import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RoleFeaturePermissionsService } from './role-feature-permissions.service';
import { RoleFeaturePermission } from './role-feature-permission.entity';

@Controller('role-feature-permissions')
export class RoleFeaturePermissionsController {
  constructor(private readonly roleFeaturePermissionsService: RoleFeaturePermissionsService) {}

  @Post()
  create(@Body() createPermissionDto: Partial<RoleFeaturePermission>) {
    return this.roleFeaturePermissionsService.create(createPermissionDto);
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
    return this.roleFeaturePermissionsService.checkPermission(roleId, featureName, requiredLevel);
  }

  @Put(':roleId/:featureId')
  update(
    @Param('roleId') roleId: string,
    @Param('featureId') featureId: string,
    @Body() updatePermissionDto: Partial<RoleFeaturePermission>,
  ) {
    return this.roleFeaturePermissionsService.update(roleId, featureId, updatePermissionDto);
  }

  @Delete(':roleId/:featureId')
  remove(@Param('roleId') roleId: string, @Param('featureId') featureId: string) {
    return this.roleFeaturePermissionsService.remove(roleId, featureId);
  }
}
