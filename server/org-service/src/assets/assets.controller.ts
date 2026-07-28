import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // Asset endpoints
  @Post()
  create(@Body() createAssetDto: Partial<Asset>) {
    return this.assetsService.create(createAssetDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.assetsService.findAll(organizationId);
  }

  @Get('deleted')
  findDeleted(@Query('organizationId') organizationId: string) {
    return this.assetsService.findDeleted(organizationId);
  }

  @Get('reports/org-report')
  getAssetOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
    @Query('storeId') storeId?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.assetsService.getAssetOrgReport(organizationId, {
      startDate,
      endDate,
      status,
      condition,
      storeId,
      userId,
      search,
      includeDeleted,
    });
  }

  @Get('tables')
  findAllTables(@Query('organizationId') organizationId: string) {
    return this.assetsService.findAllTables(organizationId);
  }

  @Get('tables/:id')
  findOneTable(@Param('id') id: string) {
    return this.assetsService.findOneTable(id);
  }

  @Post('tables')
  createTable(@Body() createTableDto: Partial<AssetTable>) {
    return this.assetsService.createTable(createTableDto);
  }

  @Put('tables/:id')
  updateTable(@Param('id') id: string, @Body() updateTableDto: Partial<AssetTable>) {
    return this.assetsService.updateTable(id, updateTableDto);
  }

  @Delete('tables/:id')
  removeTable(@Param('id') id: string) {
    return this.assetsService.removeTable(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: Partial<Asset>) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Put(':id/restore')
  restore(@Param('id') id: string) {
    return this.assetsService.restore(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.softDelete(id);
  }
}
