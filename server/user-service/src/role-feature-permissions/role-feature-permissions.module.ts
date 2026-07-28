import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleFeaturePermissionsService } from './role-feature-permissions.service';
import { RoleFeaturePermissionsController } from './role-feature-permissions.controller';
import { RoleFeaturePermission } from './role-feature-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleFeaturePermission], 'user')],
  controllers: [RoleFeaturePermissionsController],
  providers: [RoleFeaturePermissionsService],
  exports: [RoleFeaturePermissionsService],
})
export class RoleFeaturePermissionsModule {}
