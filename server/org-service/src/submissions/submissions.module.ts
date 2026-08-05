import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission } from './submission.entity';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';
import { ProcessesModule } from '../processes/processes.module';
import { AuditsModule } from '../audits/audits.module';
import { EntitiesModule } from '../entities/entities.module';
import { SupabaseStorageService } from '../noticeboard/supabase-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Process, Audit], 'org'), ProcessesModule, AuditsModule, EntitiesModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SupabaseStorageService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
