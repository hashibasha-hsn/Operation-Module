import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';
import { assetUploadOptions, buildAssetFilename } from './asset-upload.config';
import { SupabaseStorageService } from '../noticeboard/supabase-storage.service';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  // Asset endpoints
  @Post()
  create(@Body() createAssetDto: Partial<Asset>) {
    return this.assetsService.create(createAssetDto);
  }

  @Post('draft')
  saveDraft(@Body() draftDto: Partial<Asset>) {
    return this.assetsService.saveDraft(draftDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('search') search?: string,
    @Query('tableId') tableId?: string,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
    @Query('storeId') storeId?: string,
    @Query('userId') userId?: string,
    @Query('expiryFrom') expiryFrom?: string,
    @Query('expiryTo') expiryTo?: string,
    @Query('customFields') customFields?: string,
  ) {
    return this.assetsService.findAll(organizationId, {
      search,
      tableId,
      status,
      condition,
      storeId,
      userId,
      expiryFrom,
      expiryTo,
      customFields: customFields ? JSON.parse(customFields) : undefined,
    });
  }

  @Get('deleted')
  findDeleted(@Query('organizationId') organizationId: string) {
    return this.assetsService.findDeleted(organizationId);
  }

  @Post('bulk-upload')
  bulkUpload(
    @Body() body: { organizationId: string; rows: any[]; createdBy?: string },
  ) {
    return this.assetsService.bulkUpload(body.organizationId, body.rows, body.createdBy);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', assetUploadOptions))
  async uploadAssetFile(@UploadedFile() file?: any) {
    if (!file) return { url: null };
    const url = await this.storageService.uploadFile(
      file.buffer,
      buildAssetFilename(file.originalname),
      file.mimetype,
      'asset-files',
    );
    return { url };
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

  // Filter presets
  @Get('filters')
  findFilters(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId?: string,
  ) {
    return this.assetsService.findFilters(organizationId, userId);
  }

  @Post('filters')
  createFilter(@Body() body: any) {
    return this.assetsService.createFilter(body);
  }

  @Put('filters/:id')
  updateFilter(@Param('id') id: string, @Body() body: any) {
    return this.assetsService.updateFilter(id, body);
  }

  @Delete('filters/:id')
  removeFilter(@Param('id') id: string) {
    return this.assetsService.removeFilter(id);
  }

  // Asset table endpoints
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

  @Put('tables/:id/publish')
  publishTable(@Param('id') id: string) {
    return this.assetsService.publishTable(id);
  }

  @Put('tables/:id/archive')
  archiveTable(@Param('id') id: string) {
    return this.assetsService.archiveTable(id);
  }

  @Delete('tables/:id')
  removeTable(@Param('id') id: string) {
    return this.assetsService.removeTable(id);
  }

  // Asset actions
  @Put(':id/transfer')
  transfer(
    @Param('id') id: string,
    @Body() body: { newOwnerId: string; actor?: string },
  ) {
    return this.assetsService.transferOwnership(id, body.newOwnerId, body.actor);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; actor?: string },
  ) {
    return this.assetsService.updateStatus(id, body.status, body.actor);
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
  restore(@Param('id') id: string, @Body() body: { actor?: string }) {
    return this.assetsService.restore(id, body?.actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.softDelete(id);
  }
}
