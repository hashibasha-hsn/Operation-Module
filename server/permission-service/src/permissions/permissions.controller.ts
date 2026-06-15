import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('cache')
  cachePermissions(@Body() body: { userId: string; orgId: string; roleId: string; permissions: any }) {
    return this.permissionsService.cachePermissions(body.userId, body.orgId, body.roleId, body.permissions);
  }

  @Get('cache/:userId/:orgId')
  getCachedPermissions(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.permissionsService.getCachedPermissions(userId, orgId);
  }

  @Delete('cache/:userId/:orgId')
  invalidateCache(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.permissionsService.invalidateCache(userId, orgId);
  }

  @Post('audit-logs')
  logPermissionChange(@Body() logData: any) {
    return this.permissionsService.logPermissionChange(logData);
  }

  @Post('role-change-history')
  logRoleChange(@Body() logData: any) {
    return this.permissionsService.logRoleChange(logData);
  }

  @Get('role-change-history/:userId/:orgId')
  getRoleChangeHistory(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.permissionsService.getRoleChangeHistory(userId, orgId);
  }

  @Post('scope-access')
  grantScopeAccess(@Body() body: { userId: string; orgId: string; scopeType: string; scopeId: string; permissions: any }) {
    return this.permissionsService.grantScopeAccess(body.userId, body.orgId, body.scopeType, body.scopeId, body.permissions);
  }

  @Delete('scope-access/:userId/:orgId/:scopeType/:scopeId')
  revokeScopeAccess(@Param('userId') userId: string, @Param('orgId') orgId: string, @Param('scopeType') scopeType: string, @Param('scopeId') scopeId: string) {
    return this.permissionsService.revokeScopeAccess(userId, orgId, scopeType, scopeId);
  }

  @Get('scope-access/:userId/:orgId')
  getUserScopeAccess(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.permissionsService.getUserScopeAccess(userId, orgId);
  }

  @Get('check/:userId/:orgId/:permission')
  checkPermission(@Param('userId') userId: string, @Param('orgId') orgId: string, @Param('permission') permission: string, @Body('scopeId') scopeId?: string) {
    return this.permissionsService.checkPermission(userId, orgId, permission, scopeId);
  }

  @Get('check-scope/:userId/:orgId/:scopeType/:scopeId/:permission')
  checkScopePermission(@Param('userId') userId: string, @Param('orgId') orgId: string, @Param('scopeType') scopeType: string, @Param('scopeId') scopeId: string, @Param('permission') permission: string) {
    return this.permissionsService.checkScopePermission(userId, orgId, scopeType, scopeId, permission);
  }
}
