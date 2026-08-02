import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admins')
  async findAdmins() {
    return this.usersService.findByRole('admin');
  }

  @Get('role/:role')
  async findByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role);
  }

  @Put(':id/role')
  async setRole(
    @Param('id') id: string,
    @Body() body: { role: string; actorUserId?: string },
    @Headers('x-user-id') headerActorId?: string,
  ) {
    const actorId = body.actorUserId || headerActorId;
    return this.usersService.setRole(id, body.role, actorId);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, Number.parseInt(String(page ?? '1'), 10) || 1);
    const limitNum = Math.min(
      1000,
      Math.max(1, Number.parseInt(String(limit ?? '10'), 10) || 10),
    );
    return this.usersService.findAll(pageNum, limitNum, search);
  }

  @Get('stats/overview')
  async getStats() {
    return this.usersService.getStats();
  }

  @Post('bulk')
  async bulkCreate(@Body() body: { users?: any[] }) {
    return this.usersService.bulkCreate(body.users || []);
  }

  @Get('removed')
  async findRemoved() {
    return this.usersService.findRemoved();
  }

  @Post('removed/:id/restore')
  async restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Put(':id/advance-mapping')
  async updateAdvanceMapping(
    @Param('id') id: string,
    @Body() body: { additionalStores: string[] },
  ) {
    return this.usersService.updateAdvanceMapping(id, body.additionalStores || []);
  }

  @Put(':id/hybrid')
  async updateHybrid(
    @Param('id') id: string,
    @Body() body: { isHybrid: boolean; hybridStores: string[] },
  ) {
    return this.usersService.updateHybrid(id, body);
  }

  @Put(':id/last-login')
  async updateLastLogin(
    @Param('id') id: string,
    @Body() body: { lastLogin?: string },
  ) {
    const lastLogin = body.lastLogin ? new Date(body.lastLogin) : new Date();
    return this.usersService.updateLastLogin(id, lastLogin);
  }

  @Get(':id/profile-completion')
  async getProfileCompletion(@Param('id') id: string) {
    return this.usersService.getProfileCompletion(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
