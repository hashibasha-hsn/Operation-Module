import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from './snake-naming.strategy';
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
import { AuthModule } from './domains/auth/auth/auth.module';
import { PermissionsModule } from './domains/permission/permissions/permissions.module';
import { NotificationsModule } from './domains/notification/notifications/notifications.module';
import { HealthModule } from './health.module';
import { SharedModule } from './shared/shared.module';
import { AuditContextMiddleware } from './shared/audit-context.middleware';
import { CrudAuditSubscriber } from './shared/crud-audit.subscriber';
import { ensurePostgresSchema } from './ensure-schema';

const USER_ENTITY_FOLDERS = [
  'profiles',
  'roles',
  'memberships',
  'users',
  'designations',
  'system-roles',
  'features',
  'role-feature-permissions',
  'designation-role-mapping',
  'user-designations',
  'user-tags',
  'user-teams',
  'noticeboard',
  'tags',
  'hybrid-assignee',
];

async function buildConnection(
  name: string,
  schemaEnvKey: string,
  defaultSchema: string,
  entityGlobs: string[],
  config: ConfigService,
  namingStrategy?: SnakeNamingStrategy,
) {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const schema = config.get<string>(schemaEnvKey) || defaultSchema;
  const ssl = config.get<string>('DB_SSL') === 'true';

  await ensurePostgresSchema({
    schema,
    databaseUrl,
    host: config.get<string>('DB_HOST'),
    port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
    user: config.get<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    ssl,
  });

  // Prefer host/port over DATABASE_URL so Node IPv4 (family:4) is applied reliably.
  const host = config.get<string>('DB_HOST');
  return {
    name,
    type: 'postgres' as const,
    ...(host
      ? {
          host,
          port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
          username: config.get<string>('DB_USER') || 'postgres',
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME') || 'postgres',
        }
      : databaseUrl
        ? { url: databaseUrl }
        : {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: config.get<string>('DB_PASSWORD'),
            database: 'postgres',
          }),
    schema,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    extra: { family: 4 },
    entities: entityGlobs,
    subscribers: ['user', 'auth', 'permission', 'notification'].includes(name)
      ? [CrudAuditSubscriber]
      : [],
    synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
    ...(namingStrategy ? { namingStrategy } : {}),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env')],
    }),
    TypeOrmModule.forRootAsync({
      name: 'user',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'user',
          'USER_DB_SCHEMA',
          'hashibasha_user',
          USER_ENTITY_FOLDERS.map((folder) => join(__dirname, folder, '**', '*.entity.{ts,js}')),
          config,
          new SnakeNamingStrategy(),
        ),
    }),
    TypeOrmModule.forRootAsync({
      name: 'auth',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'auth',
          'AUTH_DB_SCHEMA',
          'hashibasha_auth',
          [join(__dirname, 'domains', 'auth', '**', '*.entity.{ts,js}')],
          config,
        ),
    }),
    TypeOrmModule.forRootAsync({
      name: 'permission',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'permission',
          'PERMISSION_DB_SCHEMA',
          'hashibasha_permission',
          [join(__dirname, 'domains', 'permission', '**', '*.entity.{ts,js}')],
          config,
        ),
    }),
    TypeOrmModule.forRootAsync({
      name: 'notification',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'notification',
          'NOTIFICATION_DB_SCHEMA',
          'hashibasha_notification',
          [join(__dirname, 'domains', 'notification', '**', '*.entity.{ts,js}')],
          config,
        ),
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
    AuthModule,
    PermissionsModule,
    NotificationsModule,
    HealthModule,
    SharedModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
