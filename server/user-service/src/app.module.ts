import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesModule } from './profiles/profiles.module';
import { RolesModule } from './roles/roles.module';
import { MembershipsModule } from './memberships/memberships.module';
import { UsersModule } from './users/users.module';
import { DesignationsModule } from './designations/designations.module';
import { SystemRolesModule } from './system-roles/system-roles.module';
import { FeaturesModule } from './features/features.module';
import { RoleFeaturePermissionsModule } from './role-feature-permissions/role-feature-permissions.module';
import { DesignationRoleMappingModule } from './designation-role-mapping/designation-role-mapping.module';
import { UserDesignationsModule } from './user-designations/user-designations.module';
import { UserTagsModule } from './user-tags/user-tags.module';
import { UserTeamsModule } from './user-teams/user-teams.module';
import { NoticeboardModule } from './noticeboard/noticeboard.module';
import { TagsModule } from './tags/tags.module';
import { SeedModule } from './seed/seed.module';
import { HybridAssigneeModule } from './hybrid-assignee/hybrid-assignee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Rasika',
      database: process.env.DB_NAME || 'hashibasha_user',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ProfilesModule,
    RolesModule,
    MembershipsModule,
    UsersModule,
    DesignationsModule,
    SystemRolesModule,
    FeaturesModule,
    RoleFeaturePermissionsModule,
    DesignationRoleMappingModule,
    UserDesignationsModule,
    UserTagsModule,
    UserTeamsModule,
    NoticeboardModule,
    TagsModule,
    SeedModule,
    HybridAssigneeModule,
  ],
})
export class AppModule {}
