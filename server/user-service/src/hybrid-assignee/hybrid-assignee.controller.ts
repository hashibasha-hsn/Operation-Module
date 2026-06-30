import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import {
  HybridAssigneeService,
  HybridAssigneeProfileDto,
  SaveHybridProfileDto,
} from './hybrid-assignee.service';

@Controller('hybrid-assignee-profiles')
export class HybridAssigneeController {
  constructor(private readonly hybridAssigneeService: HybridAssigneeService) {}

  @Get('dashboard')
  getDashboard(@Query('organizationId') organizationId: string) {
    return this.hybridAssigneeService.getDashboard(organizationId || 'default-org');
  }

  @Get('lookup/users')
  findUsersForAssignment(
    @Query('storeId') storeId: string,
    @Query('assignmentType') assignmentType: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.hybridAssigneeService.findUsersForStoreAndType(
      storeId,
      assignmentType,
      organizationId || 'default-org',
    );
  }

  @Post('stores')
  addStores(@Body() body: { organizationId?: string; storeIds: string[] }) {
    return this.hybridAssigneeService.addStores(body.organizationId || 'default-org', body.storeIds || []);
  }

  @Delete('stores/:storeId')
  removeStore(
    @Param('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.hybridAssigneeService.removeStore(organizationId || 'default-org', storeId);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.hybridAssigneeService.findAll(organizationId || 'default-org');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hybridAssigneeService.findOne(id);
  }

  @Post()
  create(@Body() body: HybridAssigneeProfileDto) {
    return this.hybridAssigneeService.create(body);
  }

  @Put(':id/cell')
  updateCell(
    @Param('id') id: string,
    @Body() body: { storeId: string; userIds: string[] },
  ) {
    return this.hybridAssigneeService.updateCell(id, body.storeId, body.userIds || []);
  }

  @Put(':id/rename')
  renameProfile(@Param('id') id: string, @Body() body: { name: string }) {
    return this.hybridAssigneeService.renameProfile(id, body.name || '');
  }

  @Put(':id')
  saveProfile(@Param('id') id: string, @Body() body: SaveHybridProfileDto) {
    return this.hybridAssigneeService.saveProfile(id, body);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.hybridAssigneeService.publish(id);
  }

  @Post(':id/copy')
  copy(@Param('id') id: string) {
    return this.hybridAssigneeService.copy(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hybridAssigneeService.remove(id);
  }
}
