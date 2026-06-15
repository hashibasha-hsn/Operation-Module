import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { BusinessEntity } from './entity.entity';

@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  create(@Body() createEntityDto: Partial<BusinessEntity>) {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.entitiesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entitiesService.findOne(id);
  }

  @Get('entity-id/:entityId')
  findByEntityId(@Param('entityId') entityId: string) {
    return this.entitiesService.findByEntityId(entityId);
  }

  @Get('status/:storeStatus')
  findByStoreStatus(@Param('storeStatus') storeStatus: string, @Query('organizationId') organizationId: string) {
    return this.entitiesService.findByStoreStatus(storeStatus, organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEntityDto: Partial<BusinessEntity>) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: boolean) {
    return this.entitiesService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entitiesService.remove(id);
  }
}
