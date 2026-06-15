import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // Assessment endpoints
  @Post()
  create(@Body() createAssessmentDto: Partial<Assessment>) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.assessmentsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAssessmentDto: Partial<Assessment>) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }

  // Assessment Result endpoints
  @Post('results')
  createResult(@Body() createResultDto: Partial<AssessmentResult>) {
    return this.assessmentsService.createResult(createResultDto);
  }

  @Get('results/user/:userId')
  findUserResults(@Param('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.assessmentsService.findUserResults(userId, organizationId);
  }

  @Get('results/assessment/:assessmentId')
  findResultsByAssessment(@Param('assessmentId') assessmentId: string) {
    return this.assessmentsService.findResultsByAssessment(assessmentId);
  }

  @Put('results/:id')
  updateResult(@Param('id') id: string, @Body() updateResultDto: Partial<AssessmentResult>) {
    return this.assessmentsService.updateResult(id, updateResultDto);
  }

  // Assessment Report endpoints
  @Get('reports/assessment-report')
  getAssessmentReport(
    @Query('assessmentId') assessmentId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.assessmentsService.getAssessmentReport(assessmentId, organizationId, start, end);
  }

  @Get('reports/org-report')
  getAssessmentOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.assessmentsService.getAssessmentOrgReport(organizationId, start, end);
  }

  @Get('reports/submission-list/:assessmentId')
  getAssessmentSubmissionList(
    @Param('assessmentId') assessmentId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.assessmentsService.getAssessmentSubmissionList(assessmentId, organizationId);
  }

  @Delete('reports/submission/:submissionId')
  deleteAssessmentSubmission(@Param('submissionId') submissionId: string) {
    return this.assessmentsService.deleteAssessmentSubmission(submissionId);
  }
}
