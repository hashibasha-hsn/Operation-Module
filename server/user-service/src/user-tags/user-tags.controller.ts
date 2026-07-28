import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UserTagsService } from './user-tags.service';

@Controller('user-tags')
export class UserTagsController {
  constructor(private readonly userTagsService: UserTagsService) {}

  @Get()
  async findAll(@Query('organizationId') organizationId: string) {
    return this.userTagsService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userTagsService.findOne(id);
  }

  @Post()
  async create(@Body() createUserTagDto: any) {
    return this.userTagsService.create(createUserTagDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserTagDto: any) {
    return this.userTagsService.update(id, updateUserTagDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userTagsService.remove(id);
  }
}
