import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnapshotEmailSettings } from './snapshot-email-settings.entity';
import { SnapshotEmailService } from './snapshot-email.service';
import { SnapshotEmailController } from './snapshot-email.controller';
import { EmailCoreModule } from '../providers/email-core.module';

@Module({
  imports: [TypeOrmModule.forFeature([SnapshotEmailSettings]), EmailCoreModule],
  controllers: [SnapshotEmailController],
  providers: [SnapshotEmailService],
  exports: [SnapshotEmailService],
})
export class SnapshotEmailModule {}
