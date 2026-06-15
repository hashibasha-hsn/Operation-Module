import { Controller, Get, Query } from '@nestjs/common';
import { ExecutiveDashboardService } from './executive-dashboard.service';

@Controller('executive-dashboard')
export class ExecutiveDashboardController {
  constructor(private readonly executiveDashboardService: ExecutiveDashboardService) {}

  @Get('org-summary')
  getOrgSummary(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('metricType') metricType?: 'count' | 'percentage',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getOrgSummary(organizationId, start, end, tagFilter, metricType);
  }

  @Get('all-stores')
  getAllStores(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('periodicity') periodicity?: 'daily' | 'weekly' | 'monthly',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getAllStores(organizationId, start, end, tagFilter, periodicity);
  }

  @Get('heat-map')
  getHeatMap(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('periodicity') periodicity?: 'daily' | 'weekly' | 'monthly',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getHeatMap(organizationId, start, end, periodicity);
  }

  @Get('snapshot')
  getSnapshot(
    @Query('organizationId') organizationId: string,
    @Query('date') date?: string,
    @Query('storeId') storeId?: string,
    @Query('processId') processId?: string,
  ) {
    const dateObj = date ? new Date(date) : undefined;
    return this.executiveDashboardService.getSnapshot(organizationId, dateObj, storeId, processId);
  }

  @Get('process-tag-insights')
  getProcessTagInsights(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('viewType') viewType?: 'completion' | 'compliance',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getProcessTagInsights(organizationId, start, end, viewType);
  }
}
