import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { OrganizationsModule } from './organizations/organizations.module';
import { RegionsModule } from './regions/regions.module';
import { LocationsModule } from './locations/locations.module';
import { EntitiesModule } from './entities/entities.module';
import { ProcessesModule } from './processes/processes.module';
import { AuditsModule } from './audits/audits.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ActionPointsModule } from './action-points/action-points.module';
import { TicketsModule } from './tickets/tickets.module';
import { AssetsModule } from './assets/assets.module';
import { CoursesModule } from './courses/courses.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ExecutiveDashboardModule } from './executive-dashboard/executive-dashboard.module';
import { BIDashboardModule } from './bi-dashboard/bi-dashboard.module';
import { NoticeboardModule } from './noticeboard/noticeboard.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SaLocationsModule } from './domains/location/sa-locations/sa-locations.module';
import { LocationsModule as GeoLocationsModule } from './domains/location/locations/locations.module';
import { TranslationsModule } from './domains/language/translations/translations.module';
import { SharedModule } from './shared/shared.module';
import { AuditContextMiddleware } from './shared/audit-context.middleware';
import { CrudAuditSubscriber } from './shared/crud-audit.subscriber';
import { ensurePostgresSchema } from './ensure-schema';

const ORG_ENTITY_FOLDERS = [
  'organizations',
  'regions',
  'locations',
  'entities',
  'processes',
  'audits',
  'submissions',
  'action-points',
  'tickets',
  'assets',
  'courses',
  'assessments',
  'bi-dashboard',
  'noticeboard',
  'attendance',
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
    subscribers: name === 'org' ? [CrudAuditSubscriber] : [],
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
      name: 'org',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'org',
          'ORG_DB_SCHEMA',
          'hashibasha_org',
          ORG_ENTITY_FOLDERS.map((folder) => join(__dirname, folder, '**', '*.entity.{ts,js}')),
          config,
          new SnakeNamingStrategy(),
        ),
    }),
    TypeOrmModule.forRootAsync({
      name: 'location',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'location',
          'LOCATION_DB_SCHEMA',
          'hashibasha_location',
          [join(__dirname, 'domains', 'location', '**', '*.entity.{ts,js}')],
          config,
          new SnakeNamingStrategy(),
        ),
    }),
    TypeOrmModule.forRootAsync({
      name: 'language',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildConnection(
          'language',
          'LANGUAGE_DB_SCHEMA',
          'hashibasha_language',
          [join(__dirname, 'domains', 'language', '**', '*.entity.{ts,js}')],
          config,
          new SnakeNamingStrategy(),
        ),
    }),
    OrganizationsModule,
    SaLocationsModule,
    GeoLocationsModule,
    RegionsModule,
    LocationsModule,
    EntitiesModule,
    ProcessesModule,
    AuditsModule,
    SubmissionsModule,
    ActionPointsModule,
    TicketsModule,
    AssetsModule,
    CoursesModule,
    AssessmentsModule,
    BIDashboardModule,
    ExecutiveDashboardModule,
    NoticeboardModule,
    AttendanceModule,
    TranslationsModule,
    SharedModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
