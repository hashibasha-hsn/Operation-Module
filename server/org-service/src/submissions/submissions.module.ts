import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission } from './submission.entity';
import { ProcessesModule } from '../processes/processes.module';
import { AuditsModule } from '../audits/audits.module';
import { EntitiesModule } from '../entities/entities.module';

@Module({
  imports: [TypeOrmModule.forFeature([Submission], 'org'), ProcessesModule, AuditsModule, EntitiesModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
