import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { Submission } from './submission.entity';
import { SupabaseStorageService } from '../noticeboard/supabase-storage.service';
import { submissionUploadOptions, buildSubmissionFilename } from './submission-upload.config';

@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  @Post()
  create(@Body() createSubmissionDto: Partial<Submission>) {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', submissionUploadOptions))
  async uploadAnswerFile(@UploadedFile() file?: any) {
    if (!file) {
      return { url: null };
    }
    const url = await this.storageService.uploadFile(
      file.buffer,
      buildSubmissionFilename(file.originalname),
      file.mimetype,
      'submission-files',
    );
    return { url };
  }

  @Get('process/user')
  findUserProcessSubmissions(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.submissionsService.findUserProcessSubmissions(userId, organizationId ?? 'default-org');
  }

  @Get('process/draft')
  findProcessDraft(
    @Query('processId') processId: string,
    @Query('userId') userId: string,
    @Query('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.submissionsService.findProcessDraft(
      processId,
      userId,
      storeId,
      organizationId ?? 'default-org',
    );
  }

  @Post('process/start')
  startProcess(@Body() body: {
    processId: string;
    userId: string;
    storeId: string;
    organizationId?: string;
    submissionDate?: string;
  }) {
    return this.submissionsService.startProcessSubmission({
      ...body,
      organizationId: body.organizationId ?? 'default-org',
    });
  }

  @Put('process/:id/save')
  saveProcessDraft(
    @Param('id') id: string,
    @Body() body: { userId: string; answers: Record<string, unknown> },
  ) {
    return this.submissionsService.saveProcessDraft(id, body.userId, body.answers);
  }

  @Put('process/:id/submit')
  submitProcess(
    @Param('id') id: string,
    @Body() body: { userId: string; answers: Record<string, unknown> },
  ) {
    return this.submissionsService.submitProcess(id, body.userId, body.answers);
  }

  @Delete('process/:id/discard')
  discardProcessDraft(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.submissionsService.discardProcessDraft(id, userId);
  }

  @Get('audit/user')
  findUserAuditSubmissions(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.submissionsService.findUserAuditSubmissions(userId, organizationId ?? 'default-org');
  }

  @Post('audit/start')
  startAudit(@Body() body: {
    auditId: string;
    userId: string;
    storeId: string;
    organizationId?: string;
    submissionDate?: string;
  }) {
    return this.submissionsService.startAuditSubmission({
      ...body,
      organizationId: body.organizationId ?? 'default-org',
    });
  }

  @Put('audit/:id/save')
  saveAuditDraft(
    @Param('id') id: string,
    @Body() body: { userId: string; answers: Record<string, unknown> },
  ) {
    return this.submissionsService.saveAuditSubmissionDraft(id, body.userId, body.answers);
  }

  @Put('audit/:id/submit')
  submitAudit(
    @Param('id') id: string,
    @Body() body: { userId: string; answers: Record<string, unknown> },
  ) {
    return this.submissionsService.submitAudit(id, body.userId, body.answers);
  }

  @Delete('audit/:id/discard')
  discardAuditDraft(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.submissionsService.discardAuditDraft(id, userId);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.submissionsService.findAll(organizationId);
  }

  @Get('pending')
  findPendingApprovals(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.submissionsService.findPendingApprovals(userId, organizationId);
  }

  // Report endpoints (must stay before @Get(':id'))
  @Get('reports/my-report')
  getMyReport(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getMyReport(userId, organizationId, start, end);
  }

  @Get('reports/store-report')
  getStoreReport(
    @Query('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getStoreReport(storeId, organizationId, start, end);
  }

  @Get('reports/process-report')
  getProcessReport(
    @Query('processId') processId: string,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
    @Query('submittedBy') submittedBy?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeAllStatuses') includeAllStatuses?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getProcessReport(processId || 'all', organizationId, start, end, {
      storeId,
      submittedBy,
      status,
      search,
      includeAllStatuses: includeAllStatuses !== 'false',
    });
  }

  @Get('reports/organization-report')
  getOrganizationReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getOrganizationReport(organizationId, start, end);
  }

  @Get('reports/visual-report')
  getVisualReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getVisualReport(organizationId, start, end);
  }

  @Get('reports/expired-submissions')
  getExpiredSubmissions(@Query('organizationId') organizationId: string) {
    return this.submissionsService.getExpiredSubmissions(organizationId);
  }

  @Get('reports/workflow-detail')
  getWorkflowDetail(
    @Query('workflowId') workflowId: string,
    @Query('workflowType') workflowType: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.submissionsService.getWorkflowDetail(
      workflowId,
      workflowType || 'process',
      organizationId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSubmissionDto: Partial<Submission>) {
    return this.submissionsService.update(id, updateSubmissionDto);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string, @Body() body: { reviewerId: string }) {
    return this.submissionsService.approve(id, body.reviewerId);
  }

  @Put(':id/correction')
  sendForCorrection(
    @Param('id') id: string,
    @Body() body: { reviewerId: string; correctionNotes: string }
  ) {
    return this.submissionsService.sendForCorrection(id, body.reviewerId, body.correctionNotes);
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reviewerId: string; rejectionReason: string }
  ) {
    return this.submissionsService.reject(id, body.reviewerId, body.rejectionReason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.submissionsService.remove(id);
  }
}
