import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './ticket.entity';
import { TicketTag } from './ticket-tag.entity';
import { AutoTicketCategory } from './auto-ticket-category.entity';
import { TicketRule } from './ticket-rule.entity';
import { TicketSettings } from './ticket-settings.entity';
import { TicketClosureQuestion } from './ticket-closure-question.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // --- Static routes (must be before :id) ---

  @Post()
  create(@Body() createTicketDto: Partial<Ticket>) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketsService.findAll(
      organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('assigned-to-me')
  findAssignedToMe(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.ticketsService.findAssignedToMe(userId, organizationId);
  }

  @Get('created-by-me')
  findCreatedByMe(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.ticketsService.findCreatedByMe(userId, organizationId);
  }

  @Get('settings')
  getSettings(@Query('organizationId') organizationId: string) {
    return this.ticketsService.getSettings(organizationId);
  }

  @Put('settings')
  updateSettings(@Body() body: Partial<TicketSettings> & { organizationId: string }) {
    if (!body.organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.ticketsService.updateSettings(body.organizationId, body);
  }

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

  @Post('categories')
  createCategory(@Body() createCategoryDto: Partial<AutoTicketCategory>) {
    return this.ticketsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Query('organizationId') organizationId: string) {
    return this.ticketsService.findAllCategories(organizationId);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: Partial<AutoTicketCategory>,
  ) {
    return this.ticketsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.ticketsService.removeCategory(id);
  }

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

  @Post('rules/apply')
  applyRules(@Body() body: { organizationId?: string }) {
    return this.ticketsService.applyClosureRules(body?.organizationId);
  }

  @Post('closure-questions')
  createClosureQuestion(@Body() body: Partial<TicketClosureQuestion>) {
    return this.ticketsService.createClosureQuestion(body);
  }

  @Get('closure-questions')
  findClosureQuestions(
    @Query('organizationId') organizationId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    if (activeOnly === 'true') {
      return this.ticketsService.findActiveClosureQuestions(organizationId);
    }
    return this.ticketsService.findAllClosureQuestions(organizationId);
  }

  @Put('closure-questions/:id')
  updateClosureQuestion(
    @Param('id') id: string,
    @Body() body: Partial<TicketClosureQuestion>,
  ) {
    return this.ticketsService.updateClosureQuestion(id, body);
  }

  @Delete('closure-questions/:id')
  removeClosureQuestion(@Param('id') id: string) {
    return this.ticketsService.removeClosureQuestion(id);
  }

  @Get('reports/org-report')
  getTicketOrgReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('storeId') storeId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('categoryId') categoryId?: string,
    @Query('vendor') vendor?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketsService.getTicketOrgReport(organizationId, {
      startDate,
      endDate,
      status,
      priority,
      storeId,
      assignedTo,
      categoryId,
      vendor,
      search,
    });
  }

  @Post('reports/advance-search')
  getTicketAdvanceSearch(
    @Query('organizationId') organizationId: string,
    @Body() filters: Record<string, unknown>,
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

  // --- Parameterized ticket routes ---

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
    @Body()
    body: {
      status: string;
      userId: string;
      closureAnswers?: Record<string, unknown>;
      skipClosureQuestions?: boolean;
    },
  ) {
    return this.ticketsService.updateStatus(id, body.status, body.userId, {
      closureAnswers: body.closureAnswers,
      skipClosureQuestions: body.skipClosureQuestions,
    });
  }

  @Put(':id/comments')
  addComment(@Param('id') id: string, @Body() comment: Record<string, unknown>) {
    return this.ticketsService.addComment(id, comment);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.ticketsService.remove(id, userId);
  }
}
