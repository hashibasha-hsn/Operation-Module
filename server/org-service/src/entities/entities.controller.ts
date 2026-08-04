import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { EntitiesService } from './entities.service';
import { entityBulkUploadOptions } from './entity-bulk-upload.config';
import { BusinessEntity } from './entity.entity';

@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  create(@Body() createEntityDto: Partial<BusinessEntity>) {
    return this.entitiesService.create(createEntityDto);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file', entityBulkUploadOptions))
  async bulkUpload(
    @UploadedFile() file?: any,
    @Body('organizationId') organizationId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const filename = String(file.originalname || '').toLowerCase();
    let rows: Partial<BusinessEntity>[];

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        throw new BadRequestException(`Failed to parse Excel file: ${message}`);
      }
      // CSV fallback
      rows = this.parseCsv(file.buffer.toString('utf-8'));
    }

    const mapped = rows.map((row) => ({
      storeName: this.cell(row, 'storeName') || this.cell(row, 'Store Name'),
      entityId: this.cell(row, 'entityId') || this.cell(row, 'Entity ID'),
      area: this.cell(row, 'area'),
      city: this.cell(row, 'city'),
      storeStatus: this.cell(row, 'storeStatus') || this.cell(row, 'Store Status'),
      region: this.cell(row, 'region'),
    }));

    return this.entitiesService.bulkCreate(mapped, organizationId);
  }

  private cell(row: Record<string, unknown>, key: string): string | undefined {
    const raw = row[key ?? ''];
    return raw == null ? undefined : String(raw).trim();
  }

  private parseCsv(csv: string): Partial<BusinessEntity>[] {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      return obj;
    });
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('search') search?: string,
  ) {
    return this.entitiesService.findAll(organizationId, search);
  }

  @Get('entity-id/:entityId')
  findByEntityId(@Param('entityId') entityId: string) {
    return this.entitiesService.findByEntityId(entityId);
  }

  @Get('status/:storeStatus')
  findByStoreStatus(
    @Param('storeStatus') storeStatus: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.entitiesService.findByStoreStatus(storeStatus, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entitiesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEntityDto: Partial<BusinessEntity>) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entitiesService.remove(id);
  }
}
