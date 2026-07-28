import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignationRoleMappingService } from './designation-role-mapping.service';
import { DesignationRoleMappingController } from './designation-role-mapping.controller';
import { DesignationRoleMapping } from './designation-role-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DesignationRoleMapping], 'user')],
  controllers: [DesignationRoleMappingController],
  providers: [DesignationRoleMappingService],
  exports: [DesignationRoleMappingService],
})
export class DesignationRoleMappingModule {}
