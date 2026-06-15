import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(@Body() createProfileDto: any) {
    return this.profilesService.create(createProfileDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Put('user/:userId')
  update(@Param('userId') userId: string, @Body() updateProfileDto: any) {
    return this.profilesService.update(userId, updateProfileDto);
  }

  @Delete('user/:userId')
  remove(@Param('userId') userId: string) {
    return this.profilesService.remove(userId);
  }
}
