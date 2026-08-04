import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';
import { AssessmentCertificate } from './assessment-certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, AssessmentResult, AssessmentCertificate], 'org')],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
