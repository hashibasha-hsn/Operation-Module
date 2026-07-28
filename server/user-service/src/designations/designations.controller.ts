import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DesignationsService } from './designations.service';
import { Designation } from './designation.entity';

@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  create(@Body() createDesignationDto: Partial<Designation>) {
    return this.designationsService.create(createDesignationDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('name') name?: string,
  ) {
    return this.designationsService.findAll(organizationId || 'default-org', name);
  }

  @Get('reporting/:reportingDesignationId')
  findByReportingDesignation(@Param('reportingDesignationId') reportingDesignationId: string) {
    return this.designationsService.findByReportingDesignation(reportingDesignationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDesignationDto: Partial<Designation>) {
    return this.designationsService.update(id, updateDesignationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
