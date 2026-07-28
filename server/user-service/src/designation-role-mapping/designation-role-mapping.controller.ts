import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DesignationRoleMappingService } from './designation-role-mapping.service';
import { DesignationRoleMapping } from './designation-role-mapping.entity';

@Controller('designation-role-mapping')
export class DesignationRoleMappingController {
  constructor(private readonly designationRoleMappingService: DesignationRoleMappingService) {}

  @Post()
  create(@Body() createMappingDto: Partial<DesignationRoleMapping>) {
    return this.designationRoleMappingService.create(createMappingDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.designationRoleMappingService.findAll(organizationId);
  }

  /** Specific routes must be declared before :id */
  @Get('designation/:designationId')
  findByDesignation(@Param('designationId') designationId: string) {
    return this.designationRoleMappingService.findByDesignation(designationId);
  }

  @Get('system-role/:designationId')
  getSystemRoleForDesignation(@Param('designationId') designationId: string) {
    return this.designationRoleMappingService.getSystemRoleForDesignation(designationId);
  }

  @Put('designation/:designationId')
  upsertByDesignation(
    @Param('designationId') designationId: string,
    @Body()
    body: { systemRoleId: string; organizationId?: string; mappedBy?: string },
  ) {
    return this.designationRoleMappingService.upsertByDesignation(
      designationId,
      body.systemRoleId,
      body.organizationId || 'default-org',
      body.mappedBy,
    );
  }

  @Delete('designation/:designationId')
  removeByDesignation(@Param('designationId') designationId: string) {
    return this.designationRoleMappingService.removeByDesignation(designationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationRoleMappingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateMappingDto: Partial<DesignationRoleMapping>) {
    return this.designationRoleMappingService.update(id, updateMappingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationRoleMappingService.remove(id);
  }
}
