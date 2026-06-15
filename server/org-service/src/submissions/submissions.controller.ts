import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { Submission } from './submission.entity';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(@Body() createSubmissionDto: Partial<Submission>) {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.submissionsService.findAll(organizationId);
  }

  @Get('pending')
  findPendingApprovals(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.submissionsService.findPendingApprovals(userId, organizationId);
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
  approve(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.submissionsService.approve(id, reviewerId);
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

  // Report endpoints
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
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.submissionsService.getProcessReport(processId, organizationId, start, end);
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
}
