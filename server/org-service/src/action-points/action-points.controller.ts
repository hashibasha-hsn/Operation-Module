import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ActionPointsService } from './action-points.service';
import { ActionPoint } from './action-point.entity';

@Controller('action-points')
export class ActionPointsController {
  constructor(private readonly actionPointsService: ActionPointsService) {}

  @Post()
  create(@Body() createActionPointDto: Partial<ActionPoint>) {
    return this.actionPointsService.create(createActionPointDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.actionPointsService.findAll(organizationId);
  }

  @Get('assigned-to-me')
  findAssignedToMe(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.actionPointsService.findAssignedToMe(userId, organizationId);
  }

  @Get('created-by-me')
  findCreatedByMe(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.actionPointsService.findCreatedByMe(userId, organizationId);
  }

  @Get('closure-assigned-to-me')
  findClosureAssignedToMe(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.actionPointsService.findClosureAssignedToMe(userId, organizationId);
  }

  // Report routes must be declared before :id
  @Get('reports/org-report')
  getActionPointsOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('storeId') storeId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('triggerType') triggerType?: string,
    @Query('workflowType') workflowType?: string,
    @Query('workflowId') workflowId?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (storeId) filters.storeId = storeId;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (search) filters.search = search;
    if (triggerType) filters.triggerType = triggerType;
    if (workflowType) filters.workflowType = workflowType;
    if (workflowId) filters.workflowId = workflowId;
    return this.actionPointsService.getActionPointsOrgReport(organizationId, filters);
  }

  @Get('reports/advance-report')
  getActionPointsAdvanceReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('storeId') storeId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('triggerType') triggerType?: string,
    @Query('workflowType') workflowType?: string,
    @Query('workflowId') workflowId?: string,
    @Query('actionPointId') actionPointId?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (storeId) filters.storeId = storeId;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (search) filters.search = search;
    if (triggerType) filters.triggerType = triggerType;
    if (workflowType) filters.workflowType = workflowType;
    if (workflowId) filters.workflowId = workflowId;
    if (actionPointId) filters.actionPointId = actionPointId;
    return this.actionPointsService.getActionPointsAdvanceReport(organizationId, filters);
  }

  @Post('from-submission')
  createFromSubmission(@Body() body: any) {
    return this.actionPointsService.createFromSubmission(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionPointsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateActionPointDto: Partial<ActionPoint>) {
    return this.actionPointsService.update(id, updateActionPointDto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; userId: string }
  ) {
    return this.actionPointsService.updateStatus(id, body.status, body.userId);
  }

  @Put(':id/comments')
  addComment(@Param('id') id: string, @Body() comment: any) {
    return this.actionPointsService.addComment(id, comment);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionPointsService.remove(id);
  }
}
