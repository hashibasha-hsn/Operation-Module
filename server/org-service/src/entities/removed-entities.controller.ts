import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { RemovedEntitiesService } from './removed-entities.service';
import { RemovedEntity } from './removed-entity.entity';

@Controller('removed-entities')
export class RemovedEntitiesController {
  constructor(private readonly removedEntitiesService: RemovedEntitiesService) {}

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.removedEntitiesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.removedEntitiesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.removedEntitiesService.remove(id);
  }

  @Delete(':id/restore')
  restore(@Param('id') id: string) {
    return this.removedEntitiesService.restore(id);
  }
}
