import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SystemRolesService } from './system-roles.service';
import { SystemRole, ScopeLevel } from './system-role.entity';

@Controller('system-roles')
export class SystemRolesController {
  constructor(private readonly systemRolesService: SystemRolesService) {}

  @Post()
  create(@Body() createRoleDto: Partial<SystemRole>) {
    return this.systemRolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.systemRolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemRolesService.findOne(id);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.systemRolesService.findByName(name);
  }

  @Get('scope/:scopeLevel')
  findByScopeLevel(@Param('scopeLevel') scopeLevel: ScopeLevel) {
    return this.systemRolesService.findByScopeLevel(scopeLevel);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: Partial<SystemRole>) {
    return this.systemRolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemRolesService.remove(id);
  }
}
