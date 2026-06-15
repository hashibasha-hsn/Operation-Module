import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CourseQuiz } from './course-quiz.entity';
import { CourseProgress } from './course-progress.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Course endpoints
  @Post()
  create(@Body() createCourseDto: Partial<Course>) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.coursesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: Partial<Course>) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // Course Category endpoints
  @Post('categories')
  createCategory(@Body() createCategoryDto: Partial<CourseCategory>) {
    return this.coursesService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Query('organizationId') organizationId: string) {
    return this.coursesService.findAllCategories(organizationId);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: Partial<CourseCategory>) {
    return this.coursesService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.coursesService.removeCategory(id);
  }

  // Course Quiz endpoints
  @Post('quizzes')
  createQuiz(@Body() createQuizDto: Partial<CourseQuiz>) {
    return this.coursesService.createQuiz(createQuizDto);
  }

  @Get('quizzes')
  findAllQuizzes(@Query('organizationId') organizationId: string) {
    return this.coursesService.findAllQuizzes(organizationId);
  }

  @Put('quizzes/:id')
  updateQuiz(@Param('id') id: string, @Body() updateQuizDto: Partial<CourseQuiz>) {
    return this.coursesService.updateQuiz(id, updateQuizDto);
  }

  @Delete('quizzes/:id')
  removeQuiz(@Param('id') id: string) {
    return this.coursesService.removeQuiz(id);
  }

  // Course Progress endpoints
  @Post('progress')
  createProgress(@Body() createProgressDto: Partial<CourseProgress>) {
    return this.coursesService.createProgress(createProgressDto);
  }

  @Get('progress/user/:userId')
  findUserProgress(@Param('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.coursesService.findUserProgress(userId, organizationId);
  }

  @Put('progress/:id')
  updateProgress(@Param('id') id: string, @Body() updateProgressDto: Partial<CourseProgress>) {
    return this.coursesService.updateProgress(id, updateProgressDto);
  }

  // Learning Report endpoints
  @Get('reports/my-report')
  getLearningMyReport(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.coursesService.getLearningMyReport(userId, organizationId, start, end);
  }

  @Get('reports/store-report')
  getLearningStoreReport(
    @Query('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.coursesService.getLearningStoreReport(storeId, organizationId, start, end);
  }

  @Get('reports/team-report')
  getLearningTeamReport(
    @Query('supervisorId') supervisorId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.coursesService.getLearningTeamReport(supervisorId, organizationId, start, end);
  }

  @Get('reports/org-report')
  getLearningOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('tab') tab?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.coursesService.getLearningOrgReport(organizationId, tab || 'courses', start, end);
  }
}
