import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UserTeamsService } from './user-teams.service';

@Controller('user-teams')
export class UserTeamsController {
  constructor(private readonly userTeamsService: UserTeamsService) {}

  @Get()
  async findAll(@Query('organizationId') organizationId: string) {
    return this.userTeamsService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userTeamsService.findOne(id);
  }

  @Post()
  async create(@Body() createUserTeamDto: any) {
    return this.userTeamsService.create(createUserTeamDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserTeamDto: any) {
    return this.userTeamsService.update(id, updateUserTeamDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userTeamsService.remove(id);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body('userId') userId: string) {
    return this.userTeamsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.userTeamsService.removeMember(id, userId);
  }
}
