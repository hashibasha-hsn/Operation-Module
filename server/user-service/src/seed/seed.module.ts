import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemRolesModule } from '../system-roles/system-roles.module';
import { FeaturesModule } from '../features/features.module';
import { RoleFeaturePermissionsModule } from '../role-feature-permissions/role-feature-permissions.module';
import { SystemRole } from '../system-roles/system-role.entity';
import { Feature } from '../features/feature.entity';
import { RoleFeaturePermission } from '../role-feature-permissions/role-feature-permission.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemRole, Feature, RoleFeaturePermission], 'user'),
    SystemRolesModule,
    FeaturesModule,
    RoleFeaturePermissionsModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
