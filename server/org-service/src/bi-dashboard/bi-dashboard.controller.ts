import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BIDashboardService } from './bi-dashboard.service';

@Controller('bi-dashboard')
export class BIDashboardController {
  constructor(private readonly biDashboardService: BIDashboardService) {}

  @Post()
  createDashboard(@Body() data: any) {
    return this.biDashboardService.createDashboard(data);
  }

  @Put(':id')
  updateDashboard(@Param('id') id: string, @Body() data: any) {
    return this.biDashboardService.updateDashboard(id, data);
  }

  @Delete(':id')
  deleteDashboard(@Param('id') id: string) {
    return this.biDashboardService.deleteDashboard(id);
  }

  @Get()
  getDashboards(
    @Query('organizationId') organizationId: string,
    @Query('type') type?: string,
  ) {
    return this.biDashboardService.getDashboards(organizationId, type);
  }

  @Get(':id')
  getDashboard(@Param('id') id: string) {
    return this.biDashboardService.getDashboard(id);
  }

  @Post(':id/charts')
  createChart(@Param('id') dashboardId: string, @Body() data: any) {
    return this.biDashboardService.createChart({ ...data, dashboardId });
  }

  @Put('charts/:chartId')
  updateChart(@Param('chartId') chartId: string, @Body() data: any) {
    return this.biDashboardService.updateChart(chartId, data);
  }

  @Delete('charts/:chartId')
  deleteChart(@Param('chartId') chartId: string) {
    return this.biDashboardService.deleteChart(chartId);
  }

  @Get(':id/data')
  getDashboardData(
    @Param('id') dashboardId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.biDashboardService.getDashboardData(dashboardId, start, end);
  }
}
