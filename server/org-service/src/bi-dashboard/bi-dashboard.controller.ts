import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { BIDashboardService } from './bi-dashboard.service';
import { DASHBOARD_TEMPLATE_LIBRARY } from './dashboard-templates';

@Controller('bi-dashboard')
export class BIDashboardController {
  constructor(private readonly biDashboardService: BIDashboardService) {}

  @Get('templates/list')
  listTemplates() {
    return DASHBOARD_TEMPLATE_LIBRARY;
  }

  @Post('from-template')
  createFromTemplate(
    @Body()
    body: {
      templateId: string;
      title?: string;
      organizationId: string;
      createdBy: string;
      lastModifiedBy?: string;
    },
  ) {
    if (!body.templateId || !body.organizationId || !body.createdBy) {
      throw new BadRequestException('templateId, organizationId, and createdBy are required');
    }
    return this.biDashboardService.createDashboardFromTemplate(body.templateId, body).catch((err) => {
      if (err?.message === 'Dashboard template not found') {
        throw new NotFoundException(err.message);
      }
      throw err;
    });
  }

  @Post()
  createDashboard(@Body() data: any) {
    return this.biDashboardService.createDashboard(data);
  }

  @Put(':id')
  updateDashboard(
    @Param('id') id: string,
    @Body() data: any,
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.updateDashboard(id, data, userId || data?.updatedBy || data?.lastModifiedBy);
  }

  @Put(':id/share')
  shareDashboard(
    @Param('id') id: string,
    @Body()
    body: {
      ownerIds?: string[];
      assigneeIds?: string[];
      readOnlyAssigneeIds?: string[];
      updatedBy?: string;
      lastModifiedBy?: string;
    },
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.shareDashboard(id, body, userId || body.updatedBy || body.lastModifiedBy);
  }

  @Delete(':id')
  deleteDashboard(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.biDashboardService.deleteDashboard(id, userId);
  }

  @Get()
  getDashboards(
    @Query('organizationId') organizationId: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.getDashboards(organizationId, type, userId);
  }

  @Get(':id')
  getDashboard(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.biDashboardService.getDashboard(id, userId);
  }

  @Post(':id/charts')
  createChart(
    @Param('id') dashboardId: string,
    @Body() data: any,
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.createChart({ ...data, dashboardId }, userId || data?.updatedBy || data?.lastModifiedBy);
  }

  @Put('charts/:chartId')
  updateChart(
    @Param('chartId') chartId: string,
    @Body() data: any,
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.updateChart(chartId, data, userId || data?.updatedBy || data?.lastModifiedBy);
  }

  @Delete('charts/:chartId')
  deleteChart(@Param('chartId') chartId: string, @Query('userId') userId?: string) {
    return this.biDashboardService.deleteChart(chartId, userId);
  }

  @Get(':id/data')
  getDashboardData(
    @Param('id') dashboardId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return this.biDashboardService.getDashboardData(
      dashboardId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
      },
      userId,
    );
  }
}
