import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionCache } from './permission-cache.entity';
import { PermissionAuditLog } from './permission-audit-log.entity';
import { RoleChangeHistory } from './role-change-history.entity';
import { ScopeAccess } from './scope-access.entity';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionCache, PermissionAuditLog, RoleChangeHistory, ScopeAccess])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
