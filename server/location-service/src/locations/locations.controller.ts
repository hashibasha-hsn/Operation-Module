import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('stats')
  getStats() {
    return this.locationsService.getStats();
  }

  // ── Countries ──────────────────────────────────────────────────────────────

  @Get('countries')
  getCountries(@Query('activeOnly') activeOnly?: string) {
    return this.locationsService.findCountries(activeOnly !== 'false');
  }

  @Get('countries/:id')
  getCountry(@Param('id') id: string) {
    return this.locationsService.findCountry(id);
  }

  @Get('countries/:id/states')
  getCountryStates(
    @Param('id') id: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.locationsService.findStates(id, activeOnly !== 'false');
  }

  @Post('countries')
  createCountry(@Body() body: Record<string, unknown>) {
    return this.locationsService.createCountry({
      name: String(body.name),
      nameAr: body.nameAr ? String(body.nameAr) : null,
      code: body.code ? String(body.code) : null,
      code3: body.code3 ? String(body.code3) : null,
      phoneCode: body.phoneCode ? String(body.phoneCode) : null,
      isActive: body.isActive !== false,
      createdBy: body.createdBy ? String(body.createdBy) : 'system',
      updatedBy: body.updatedBy ? String(body.updatedBy) : String(body.createdBy ?? 'system'),
    });
  }

  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.locationsService.updateCountry(id, {
      name: body.name ? String(body.name) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      code: body.code ? String(body.code) : undefined,
      code3: body.code3 ? String(body.code3) : undefined,
      phoneCode: body.phoneCode ? String(body.phoneCode) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy) : 'system',
    });
  }

  // ── States ─────────────────────────────────────────────────────────────────

  @Get('states')
  getStates(
    @Query('countryId') countryId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.locationsService.findStates(countryId, activeOnly !== 'false');
  }

  @Get('states/:id')
  getState(@Param('id') id: string) {
    return this.locationsService.findState(id);
  }

  @Get('states/:id/cities')
  getStateCities(
    @Param('id') id: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.locationsService.findCities(id, activeOnly !== 'false');
  }

  @Post('states')
  createState(@Body() body: Record<string, unknown>) {
    return this.locationsService.createState({
      countryId: String(body.countryId),
      name: String(body.name),
      nameAr: body.nameAr ? String(body.nameAr) : null,
      code: body.code ? String(body.code) : null,
      isActive: body.isActive !== false,
      createdBy: body.createdBy ? String(body.createdBy) : 'system',
      updatedBy: body.updatedBy ? String(body.updatedBy) : String(body.createdBy ?? 'system'),
    });
  }

  @Patch('states/:id')
  updateState(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.locationsService.updateState(id, {
      name: body.name ? String(body.name) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      code: body.code ? String(body.code) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy) : 'system',
    });
  }

  // ── Cities ─────────────────────────────────────────────────────────────────

  @Get('cities')
  getCities(
    @Query('stateId') stateId?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (search?.trim()) {
      return this.locationsService.searchCities(search);
    }
    return this.locationsService.findCities(stateId, activeOnly !== 'false');
  }

  @Get('cities/:id')
  getCity(@Param('id') id: string) {
    return this.locationsService.findCity(id);
  }

  @Post('cities')
  createCity(@Body() body: Record<string, unknown>) {
    return this.locationsService.createCity({
      stateId: String(body.stateId),
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
}
