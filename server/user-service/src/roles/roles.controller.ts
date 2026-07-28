import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: any) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('initialize')
  initializeTaqticsRoles() {
    return this.rolesService.initializeTaqticsRoles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.rolesService.findByName(name as any);
  }

  @Post(':roleId/permissions/:permissionId')
  grantPermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.grantPermission(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  revokePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.revokePermission(roleId, permissionId);
  }

  @Get(':roleId/permissions')
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.rolesService.getRolePermissions(roleId);
  }

  @Post('permissions')
  createPermission(@Body() createPermissionDto: any) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions/all')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }
}
