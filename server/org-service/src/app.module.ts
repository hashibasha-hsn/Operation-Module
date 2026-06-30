import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AuditLogsModule } from './audit-logs/audit-logs.module';

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
      database: process.env.DB_NAME || 'hashibasha_org',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    OrganizationsModule,
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
    AuditLogsModule,
  ],
})
export class AppModule {}
