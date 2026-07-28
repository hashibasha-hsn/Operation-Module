import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SaLocationsService } from './sa-locations.service';

@Controller()
export class SaLocationsController {
  constructor(private readonly locationsService: SaLocationsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'location-service' };
  }

  @Get('stats')
  getStats() {
    return this.locationsService.getStats();
  }

  @Get('regions')
  getRegions(@Query('activeOnly') activeOnly?: string) {
    return this.locationsService.findRegions(activeOnly !== 'false');
  }

  @Get('regions/:id')
  getRegion(@Param('id') id: string) {
    return this.locationsService.findRegion(id);
  }

  @Get('regions/:id/cities')
  getRegionCities(@Param('id') id: string, @Query('activeOnly') activeOnly?: string) {
    return this.locationsService.findCities(id, activeOnly !== 'false');
  }

  @Post('regions')
  createRegion(@Body() body: Record<string, unknown>) {
    return this.locationsService.createRegion({
      name: String(body.name),
      nameAr: body.nameAr ? String(body.nameAr) : null,
      code: body.code ? String(body.code) : null,
      isActive: body.isActive !== false,
      createdBy: body.createdBy ? String(body.createdBy) : 'system',
      updatedBy: body.updatedBy ? String(body.updatedBy) : String(body.createdBy ?? 'system'),
    });
  }

  @Patch('regions/:id')
  updateRegion(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.locationsService.updateRegion(id, {
      name: body.name ? String(body.name) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      code: body.code ? String(body.code) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy) : 'system',
    });
  }

  @Get('cities')
  getCities(
    @Query('regionId') regionId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.locationsService.findCities(regionId, activeOnly !== 'false');
  }

  @Get('cities/:id')
  getCity(@Param('id') id: string) {
    return this.locationsService.findCity(id);
  }

  @Get('cities/:id/districts')
  getCityDistricts(@Param('id') id: string, @Query('activeOnly') activeOnly?: string) {
    return this.locationsService.findDistricts(id, activeOnly !== 'false');
  }

  @Post('cities')
  createCity(@Body() body: Record<string, unknown>) {
    return this.locationsService.createCity({
      regionId: String(body.regionId),
      name: String(body.name),
      nameAr: body.nameAr ? String(body.nameAr) : null,
      code: body.code ? String(body.code) : null,
      isActive: body.isActive !== false,
      createdBy: body.createdBy ? String(body.createdBy) : 'system',
      updatedBy: body.updatedBy ? String(body.updatedBy) : String(body.createdBy ?? 'system'),
    });
  }

  @Patch('cities/:id')
  updateCity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.locationsService.updateCity(id, {
      name: body.name ? String(body.name) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      code: body.code ? String(body.code) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy) : 'system',
    });
  }

  @Get('districts')
  getDistricts(
    @Query('cityId') cityId?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (search?.trim()) {
      return this.locationsService.searchDistricts(search);
    }
    return this.locationsService.findDistricts(cityId, activeOnly !== 'false');
  }

  @Get('districts/:id')
  getDistrict(@Param('id') id: string) {
    return this.locationsService.findDistrict(id);
  }

  @Post('districts')
  createDistrict(@Body() body: Record<string, unknown>) {
    return this.locationsService.createDistrict({
      cityId: String(body.cityId),
      name: String(body.name),
      nameAr: body.nameAr ? String(body.nameAr) : null,
      code: body.code ? String(body.code) : null,
      postalCode: body.postalCode ? String(body.postalCode) : null,
      isActive: body.isActive !== false,
      createdBy: body.createdBy ? String(body.createdBy) : 'system',
      updatedBy: body.updatedBy ? String(body.updatedBy) : String(body.createdBy ?? 'system'),
    });
  }

  @Patch('districts/:id')
  updateDistrict(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.locationsService.updateDistrict(id, {
      name: body.name ? String(body.name) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      code: body.code ? String(body.code) : undefined,
      postalCode: body.postalCode ? String(body.postalCode) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy) : 'system',
    });
  }
}
