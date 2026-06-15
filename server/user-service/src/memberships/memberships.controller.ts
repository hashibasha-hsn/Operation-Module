import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() createMembershipDto: any) {
    return this.membershipsService.createMembership(createMembershipDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.membershipsService.findByUserId(userId);
  }

  @Get('org/:orgId')
  findByOrgId(@Param('orgId') orgId: string) {
    return this.membershipsService.findByOrgId(orgId);
  }

  @Get('user/:userId/org/:orgId')
  findByUserAndOrg(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.membershipsService.findByUserAndOrg(userId, orgId);
  }

  @Put('user/:userId/org/:orgId/role')
  updateRole(@Param('userId') userId: string, @Param('orgId') orgId: string, @Body('roleId') roleId: string) {
    return this.membershipsService.updateRole(userId, orgId, roleId);
  }

  @Put('user/:userId/org/:orgId/scope')
  updateScope(@Param('userId') userId: string, @Param('orgId') orgId: string, @Body('scopeId') scopeId: string) {
    return this.membershipsService.updateScope(userId, orgId, scopeId);
  }

  @Delete('user/:userId/org/:orgId')
  removeMembership(@Param('userId') userId: string, @Param('orgId') orgId: string) {
    return this.membershipsService.removeMembership(userId, orgId);
  }
}
