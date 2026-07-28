import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CourseQuiz } from './course-quiz.entity';
import { CourseProgress } from './course-progress.entity';
import { AssessmentResult } from '../assessments/assessment-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseCategory,
      CourseQuiz,
      CourseProgress,
      AssessmentResult,
    ], 'org'),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
