import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { Audit } from './audit.entity';
import { AuditSection } from './audit-section.entity';
import { AuditQuestion } from './audit-question.entity';
import { SaveAuditDraftDto } from './save-audit-draft.dto';

@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post('draft')
  saveDraft(@Body() dto: SaveAuditDraftDto) {
    return this.auditsService.saveDraft(dto);
  }

  @Post('setup')
  createAuditSetup(@Body() data: {
    title: string;
    description: string;
    processTag: string;
    organizationId: string;
    createdBy: string;
  }) {
    return this.auditsService.createAuditSetup(data);
  }

  @Get('published/list')
  findPublished(@Query('organizationId') organizationId: string) {
    return this.auditsService.findPublished(organizationId ?? 'default-org');
  }

  @Get('assigned/list')
  findAssigned(
    @Query('userId') userId: string,
    @Query('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.auditsService.findAssignedToUser(
      userId,
      storeId || undefined,
      organizationId ?? 'default-org',
    );
  }

  @Post('assign-user')
  assignUserToAudits(@Body() body: { userId: string; auditIds: string[] }) {
    return this.auditsService.assignUserToAudits(body.userId, body.auditIds ?? []);
  }

  @Post('auto-assign-user')
  autoAssignUserToAudits(@Body() body: {
    userId: string;
    designation?: string;
    storeId?: string;
    organizationId?: string;
  }) {
    return this.auditsService.autoAssignUserToAudits(body);
  }

  @Post('sections')
  createSection(@Body() createSectionDto: Partial<AuditSection>) {
    return this.auditsService.createSection(createSectionDto);
  }

  @Put('sections/:id')
  updateSection(@Param('id') id: string, @Body() updateSectionDto: Partial<AuditSection>) {
    return this.auditsService.updateSection(id, updateSectionDto);
  }

  @Delete('sections/:id')
  removeSection(@Param('id') id: string) {
    return this.auditsService.removeSection(id);
  }

  @Post('questions')
  createQuestion(@Body() createQuestionDto: Partial<AuditQuestion>) {
    return this.auditsService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() updateQuestionDto: Partial<AuditQuestion>) {
    return this.auditsService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  removeQuestion(@Param('id') id: string) {
    return this.auditsService.removeQuestion(id);
  }

  @Post()
  create(@Body() createAuditDto: Partial<Audit>) {
    return this.auditsService.create(createAuditDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.auditsService.findAll(organizationId ?? 'default-org');
  }

  @Get(':id/with-sections')
  findOneWithSections(@Param('id') id: string) {
    return this.auditsService.findOneWithSections(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditsService.findOne(id);
  }

  @Put(':id/basic-info')
  updateAuditBasicInfo(@Param('id') id: string, @Body() data: {
    title?: string;
    description?: string;
    processTag?: string;
  }) {
    return this.auditsService.updateAuditBasicInfo(id, data);
  }

  @Put(':id/properties')
  updateAuditProperties(@Param('id') id: string, @Body() data: {
    status?: string;
    frequency?: string;
    frequencyConfig?: any;
    visibilityRules?: any;
    reminderConfig?: any;
    scoringConfig?: any;
    passThreshold?: number;
    reviewLevels?: number;
    properties?: Record<string, unknown>;
    requiresApproval?: boolean;
  }) {
    return this.auditsService.updateAuditProperties(id, data);
  }

  @Put(':id/assignment')
  updateAuditAssignment(@Param('id') id: string, @Body() data: {
    assigneeIds?: string[];
    storeIds?: string[];
  }) {
    return this.auditsService.updateAuditAssignment(id, data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAuditDto: Partial<Audit>) {
    return this.auditsService.update(id, updateAuditDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditsService.remove(id);
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.auditsService.publish(id);
  }

  @Put(':id/archive')
  archive(@Param('id') id: string) {
    return this.auditsService.archive(id);
  }
}
