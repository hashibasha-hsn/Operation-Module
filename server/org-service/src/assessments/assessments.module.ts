import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, AssessmentResult])],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
