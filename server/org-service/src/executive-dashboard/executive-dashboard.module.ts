import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutiveDashboardService } from './executive-dashboard.service';
import { ExecutiveDashboardController } from './executive-dashboard.controller';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Process, Audit])],
  controllers: [ExecutiveDashboardController],
  providers: [ExecutiveDashboardService],
  exports: [ExecutiveDashboardService],
})
export class ExecutiveDashboardModule {}
