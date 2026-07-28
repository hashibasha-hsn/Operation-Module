import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EntityTagsService } from './entity-tags.service';
import { EntityTag } from './entity-tag.entity';

@Controller('entity-tags')
export class EntityTagsController {
  constructor(private readonly entityTagsService: EntityTagsService) {}

  @Post()
  create(@Body() createTagDto: Partial<EntityTag>) {
    return this.entityTagsService.create(createTagDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.entityTagsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entityTagsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTagDto: Partial<EntityTag>) {
    return this.entityTagsService.update(+id, updateTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entityTagsService.remove(+id);
  }
}
