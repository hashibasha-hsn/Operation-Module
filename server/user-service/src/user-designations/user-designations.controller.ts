import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UserDesignationsService } from './user-designations.service';
import { UserDesignation } from './user-designation.entity';

@Controller('user-designations')
export class UserDesignationsController {
  constructor(private readonly userDesignationsService: UserDesignationsService) {}

  @Post()
  create(@Body() createAssignmentDto: Partial<UserDesignation>) {
    return this.userDesignationsService.create(createAssignmentDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.userDesignationsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userDesignationsService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userDesignationsService.findByUser(userId);
  }

  @Get('primary/:userId/:organizationId')
  findPrimaryByUser(@Param('userId') userId: string, @Param('organizationId') organizationId: string) {
    return this.userDesignationsService.findPrimaryByUser(userId, organizationId);
  }

  @Put('set-primary/:userId/:organizationId/:designationId')
  setPrimary(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
    @Param('designationId') designationId: string,
  ) {
    return this.userDesignationsService.setPrimary(userId, organizationId, designationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAssignmentDto: Partial<UserDesignation>) {
    return this.userDesignationsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userDesignationsService.remove(id);
  }
}
