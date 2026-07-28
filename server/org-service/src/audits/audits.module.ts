import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';
import { Audit } from './audit.entity';
import { AuditSection } from './audit-section.entity';
import { AuditQuestion } from './audit-question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audit, AuditSection, AuditQuestion], 'org')],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}
