import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BIDashboardService } from './bi-dashboard.service';
import { BIDashboardController } from './bi-dashboard.controller';
import { BIDashboard, BIChart } from './bi-dashboard.entity';
import { Submission } from '../submissions/submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { ActionPoint } from '../action-points/action-point.entity';
import { Ticket } from '../tickets/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BIDashboard, BIChart, Submission, Process, Audit, ActionPoint, Ticket])],
  controllers: [BIDashboardController],
  providers: [BIDashboardService],
  exports: [BIDashboardService],
})
export class BIDashboardModule {}
