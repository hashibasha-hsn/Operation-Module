import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from './assessment.entity';
import { AssessmentResult } from './assessment-result.entity';
import { SaveAssessmentDraftDto } from './save-assessment-draft.dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('draft')
  saveDraft(@Body() dto: SaveAssessmentDraftDto) {
    return this.assessmentsService.saveDraft(dto);
  }

  @Get('assigned/list')
  findAssigned(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.assessmentsService.findAssignedToUser(
      userId,
      storeId,
      organizationId || 'default-org',
    );
  }

  @Post()
  create(@Body() createAssessmentDto: Partial<Assessment>) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string, @Query('status') status?: string) {
    return this.assessmentsService.findAll(organizationId || 'default-org', status);
  }

  @Post('results/start')
  startAttempt(
    @Body()
    body: {
      assessmentId: string;
      userId: string;
      userEmail?: string;
      storeId?: string;
      organizationId?: string;
    },
  ) {
    return this.assessmentsService.startAttempt(body);
  }

  @Put('results/:id/save')
  saveAttempt(
    @Param('id') id: string,
    @Body() body: { userId: string; responses: Record<string, unknown> },
  ) {
    return this.assessmentsService.saveAttempt(id, body.userId, body.responses ?? {});
  }

  @Put('results/:id/submit')
  submitAttempt(
    @Param('id') id: string,
    @Body() body: { userId: string; responses: Record<string, unknown> },
  ) {
    return this.assessmentsService.submitAttempt(id, body.userId, body.responses ?? {});
  }

  @Delete('results/:id/discard')
  discardAttempt(@Param('id') id: string, @Query('userId') userId: string) {
    return this.assessmentsService.discardAttempt(id, userId);
  }

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

  @Get('reports/results')
  getAssessmentResultsReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.assessmentsService.getAssessmentResultsReport(organizationId, start, end);
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Put(':id/assignment')
  assignAssessment(
    @Param('id') id: string,
    @Body()
    body: { assigneeIds?: string[]; storeIds?: string[]; assigneeProfiles?: Record<string, unknown> },
  ) {
    return this.assessmentsService.assignAssessment(id, body);
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.assessmentsService.publish(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAssessmentDto: Partial<Assessment>) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}
