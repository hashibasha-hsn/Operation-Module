import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { Process } from './process.entity';
import { ProcessSection } from './process-section.entity';
import { ProcessQuestion } from './process-question.entity';
import { SaveProcessDraftDto } from './save-process-draft.dto';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  @Post('draft')
  saveDraft(@Body() dto: SaveProcessDraftDto) {
    return this.processesService.saveDraft(dto);
  }

  @Post()
  create(@Body() createProcessDto: Partial<Process>) {
    return this.processesService.create(createProcessDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.processesService.findAll(organizationId);
  }

  @Get('published/list')
  findPublished(@Query('organizationId') organizationId: string) {
    return this.processesService.findPublished(organizationId ?? 'default-org');
  }

  @Get('assigned/list')
  findAssigned(
    @Query('userId') userId: string,
    @Query('storeId') storeId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.processesService.findAssignedToUser(
      userId,
      storeId || undefined,
      organizationId ?? 'default-org',
    );
  }

  @Post('assign-user')
  assignUserToProcesses(
    @Body() body: { userId: string; processIds: string[] },
  ) {
    return this.processesService.assignUserToProcesses(body.userId, body.processIds ?? []);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.processesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProcessDto: Partial<Process>) {
    return this.processesService.update(id, updateProcessDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.processesService.remove(id);
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.processesService.publish(id);
  }

  @Put(':id/assignment')
  saveAssignment(
    @Param('id') id: string,
    @Body() body: { assigneeIds?: string[]; storeIds?: string[] },
  ) {
    return this.processesService.saveAssignment(id, body);
  }

  @Put(':id/archive')
  archive(@Param('id') id: string) {
    return this.processesService.archive(id);
  }

  // Section endpoints
  @Post('sections')
  createSection(@Body() createSectionDto: Partial<ProcessSection>) {
    return this.processesService.createSection(createSectionDto);
  }

  @Put('sections/:id')
  updateSection(@Param('id') id: string, @Body() updateSectionDto: Partial<ProcessSection>) {
    return this.processesService.updateSection(id, updateSectionDto);
  }

  @Delete('sections/:id')
  removeSection(@Param('id') id: string) {
    return this.processesService.removeSection(id);
  }

  // Question endpoints
  @Post('questions')
  createQuestion(@Body() createQuestionDto: Partial<ProcessQuestion>) {
    return this.processesService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() updateQuestionDto: Partial<ProcessQuestion>) {
    return this.processesService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  removeQuestion(@Param('id') id: string) {
    return this.processesService.removeQuestion(id);
  }
}
