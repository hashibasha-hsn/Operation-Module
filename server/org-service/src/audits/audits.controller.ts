import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { Audit } from './audit.entity';
import { AuditSection } from './audit-section.entity';
import { AuditQuestion } from './audit-question.entity';

@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

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
    occurrence?: 'one-time' | 'recurring';
    responsesAfterEndTime?: 'accept' | 'reject';
    numberOfResponses?: 'one' | 'multiple';
    submissionBy?: 'anyone' | 'everyone';
    dateRangeSelection?: 'allowed' | 'restricted';
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

  @Post()
  create(@Body() createAuditDto: Partial<Audit>) {
    return this.auditsService.create(createAuditDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.auditsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditsService.findOne(id);
  }

  @Get(':id/with-sections')
  findOneWithSections(@Param('id') id: string) {
    return this.auditsService.findOneWithSections(id);
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

  // Section endpoints
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

  // Question endpoints
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
}
