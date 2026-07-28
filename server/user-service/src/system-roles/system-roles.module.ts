import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemRolesService } from './system-roles.service';
import { SystemRolesController } from './system-roles.controller';
import { SystemRole } from './system-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemRole], 'user')],
  controllers: [SystemRolesController],
  providers: [SystemRolesService],
  exports: [SystemRolesService],
})
export class SystemRolesModule {}
