import { Controller, Get, Query, Param } from '@nestjs/common';
import { ExecutiveDashboardService, TagDimension } from './executive-dashboard.service';

@Controller('executive-dashboard')
export class ExecutiveDashboardController {
  constructor(private readonly executiveDashboardService: ExecutiveDashboardService) {}

  @Get('filter-options')
  getFilterOptions(@Query('organizationId') organizationId: string) {
    return this.executiveDashboardService.getFilterOptions(organizationId);
  }

  @Get('overview')
  getOverview(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
    @Query('periodicity') periodicity?: 'daily' | 'weekly' | 'monthly',
    @Query('metricType') metricType?: 'count' | 'percentage',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getOverview(
      organizationId,
      start,
      end,
      tagFilter,
      region,
      brand,
      department,
      periodicity,
      metricType,
    );
  }

  @Get('org-summary')
  getOrgSummary(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('metricType') metricType?: 'count' | 'percentage',
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getOrgSummary(
      organizationId,
      start,
      end,
      tagFilter,
      metricType,
      region,
      brand,
      department,
    );
  }

  @Get('all-stores')
  getAllStores(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('periodicity') periodicity?: 'daily' | 'weekly' | 'monthly',
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getAllStores(
      organizationId,
      start,
      end,
      tagFilter,
      periodicity,
      region,
      brand,
      department,
    );
  }

  @Get('store-detail/:storeId')
  getStoreDetail(
    @Param('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getStoreDetail(
      organizationId,
      storeId,
      start,
      end,
      tagFilter,
    );
  }

  @Get('heat-map')
  getHeatMap(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('periodicity') periodicity?: 'daily' | 'weekly' | 'monthly',
    @Query('tagFilter') tagFilter?: string,
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getHeatMap(
      organizationId,
      start,
      end,
      periodicity,
      tagFilter,
      region,
      brand,
      department,
    );
  }

  @Get('snapshot')
  getSnapshot(
    @Query('organizationId') organizationId: string,
    @Query('date') date?: string,
    @Query('storeId') storeId?: string,
    @Query('processId') processId?: string,
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
    @Query('tagFilter') tagFilter?: string,
  ) {
    const dateObj = date ? new Date(date) : undefined;
    return this.executiveDashboardService.getSnapshot(
      organizationId,
      dateObj,
      storeId,
      processId,
      region,
      brand,
      department,
      tagFilter,
    );
  }

  @Get('process-tag-insights')
  getProcessTagInsights(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('viewType') viewType?: 'completion' | 'compliance',
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getProcessTagInsights(
      organizationId,
      start,
      end,
      viewType,
      region,
      brand,
      department,
    );
  }

  @Get('tag-analysis')
  getTagAnalysis(
    @Query('organizationId') organizationId: string,
    @Query('dimension') dimension?: TagDimension,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tagFilter') tagFilter?: string,
    @Query('region') region?: string,
    @Query('brand') brand?: string,
    @Query('department') department?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.executiveDashboardService.getTagAnalysis(
      organizationId,
      dimension || 'region',
      start,
      end,
      tagFilter,
      region,
      brand,
      department,
    );
  }
}
