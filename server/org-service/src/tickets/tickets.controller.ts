import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './ticket.entity';
import { TicketTag } from './ticket-tag.entity';
import { AutoTicketCategory } from './auto-ticket-category.entity';
import { TicketRule } from './ticket-rule.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Ticket endpoints
  @Post()
  create(@Body() createTicketDto: Partial<Ticket>) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.ticketsService.findAll(organizationId);
  }

  @Get('assigned-to-me')
  findAssignedToMe(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.ticketsService.findAssignedToMe(userId, organizationId);
  }

  @Get('created-by-me')
  findCreatedByMe(@Query('userId') userId: string, @Query('organizationId') organizationId: string) {
    return this.ticketsService.findCreatedByMe(userId, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: Partial<Ticket>) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; userId: string }
  ) {
    return this.ticketsService.updateStatus(id, body.status, body.userId);
  }

  @Put(':id/comments')
  addComment(@Param('id') id: string, @Body() comment: any) {
    return this.ticketsService.addComment(id, comment);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  // Ticket Tag endpoints
  @Post('tags')
  createTag(@Body() createTagDto: Partial<TicketTag>) {
    return this.ticketsService.createTag(createTagDto);
  }

  @Get('tags')
  findAllTags(@Query('organizationId') organizationId: string) {
    return this.ticketsService.findAllTags(organizationId);
  }

  @Put('tags/:id')
  updateTag(@Param('id') id: string, @Body() updateTagDto: Partial<TicketTag>) {
    return this.ticketsService.updateTag(id, updateTagDto);
  }

  @Delete('tags/:id')
  removeTag(@Param('id') id: string) {
    return this.ticketsService.removeTag(id);
  }

  // Auto Ticket Category endpoints
  @Post('categories')
  createCategory(@Body() createCategoryDto: Partial<AutoTicketCategory>) {
    return this.ticketsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Query('organizationId') organizationId: string) {
    return this.ticketsService.findAllCategories(organizationId);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: Partial<AutoTicketCategory>) {
    return this.ticketsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.ticketsService.removeCategory(id);
  }

  // Ticket Rule endpoints
  @Post('rules')
  createRule(@Body() createRuleDto: Partial<TicketRule>) {
    return this.ticketsService.createRule(createRuleDto);
  }

  @Get('rules')
  findAllRules(@Query('organizationId') organizationId: string) {
    return this.ticketsService.findAllRules(organizationId);
  }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() updateRuleDto: Partial<TicketRule>) {
    return this.ticketsService.updateRule(id, updateRuleDto);
  }

  @Delete('rules/:id')
  removeRule(@Param('id') id: string) {
    return this.ticketsService.removeRule(id);
  }

  // Ticket Report endpoints
  @Get('reports/org-report')
  getTicketOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.ticketsService.getTicketOrgReport(organizationId, start, end);
  }

  @Post('reports/advance-search')
  getTicketAdvanceSearch(
    @Query('organizationId') organizationId: string,
    @Body() filters: any,
  ) {
    return this.ticketsService.getTicketAdvanceSearch(organizationId, filters);
  }

  @Get('reports/tag-report')
  getTicketTagReport(
    @Query('organizationId') organizationId: string,
    @Query('tagId') tagId?: string,
  ) {
    return this.ticketsService.getTicketTagReport(organizationId, tagId);
  }
}
