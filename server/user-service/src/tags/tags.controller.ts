import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { AdvDropdownValue } from './adv-dropdown-value.entity';
import { AssigneeProfile } from './assignee-profile.entity';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // Adv Dropdown Tag Endpoints
  @Post('adv-dropdown')
  createAdvDropdownTag(@Body() createTagDto: Partial<AdvDropdownTag>) {
    return this.tagsService.createAdvDropdownTag(createTagDto);
  }

  @Get('adv-dropdown')
  findAllAdvDropdownTags(@Query('organizationId') organizationId: string) {
    return this.tagsService.findAllAdvDropdownTags(organizationId);
  }

  @Get('adv-dropdown/:id')
  findOneAdvDropdownTag(@Param('id') id: string) {
    return this.tagsService.findOneAdvDropdownTag(id);
  }

  @Put('adv-dropdown/:id')
  updateAdvDropdownTag(@Param('id') id: string, @Body() updateTagDto: Partial<AdvDropdownTag>) {
    return this.tagsService.updateAdvDropdownTag(id, updateTagDto);
  }

  @Delete('adv-dropdown/:id')
  removeAdvDropdownTag(@Param('id') id: string) {
    return this.tagsService.removeAdvDropdownTag(id);
  }

  // Adv Dropdown Value Endpoints
  @Post('adv-dropdown-value')
  createAdvDropdownValue(@Body() createValueDto: Partial<AdvDropdownValue>) {
    return this.tagsService.createAdvDropdownValue(createValueDto);
  }

  @Put('adv-dropdown-value/:id')
  updateAdvDropdownValue(@Param('id') id: string, @Body() updateValueDto: Partial<AdvDropdownValue>) {
    return this.tagsService.updateAdvDropdownValue(id, updateValueDto);
  }

  @Delete('adv-dropdown-value/:id')
  removeAdvDropdownValue(@Param('id') id: string) {
    return this.tagsService.removeAdvDropdownValue(id);
  }

  // Assignee Profile Endpoints
  @Post('assignee-profile')
  createAssigneeProfile(@Body() createProfileDto: Partial<AssigneeProfile>) {
    return this.tagsService.createAssigneeProfile(createProfileDto);
  }

  @Get('assignee-profile')
  findAllAssigneeProfiles(@Query('organizationId') organizationId: string) {
    return this.tagsService.findAllAssigneeProfiles(organizationId);
  }

  @Get('assignee-profile/:id')
  findOneAssigneeProfile(@Param('id') id: string) {
    return this.tagsService.findOneAssigneeProfile(id);
  }

  @Put('assignee-profile/:id')
  updateAssigneeProfile(@Param('id') id: string, @Body() updateProfileDto: Partial<AssigneeProfile>) {
    return this.tagsService.updateAssigneeProfile(id, updateProfileDto);
  }

  @Delete('assignee-profile/:id')
  removeAssigneeProfile(@Param('id') id: string) {
    return this.tagsService.removeAssigneeProfile(id);
  }
}
