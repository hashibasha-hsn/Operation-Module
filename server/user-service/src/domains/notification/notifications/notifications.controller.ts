import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'notification' };
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.notificationsService.createNotification(body);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.notificationsService.findByUserId(userId);
  }

  @Get('preferences/:userId')
  getPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  @Put('preferences/:userId')
  updatePreference(
    @Param('userId') userId: string,
    @Body()
    body: {
      notificationType: string;
      [key: string]: unknown;
    },
  ) {
    const { notificationType, ...updates } = body;
    return this.notificationsService.updatePreferences(
      userId,
      notificationType || '_global',
      updates as any,
    );
  }

  @Post('preferences/:userId/sync')
  syncPreferences(
    @Param('userId') userId: string,
    @Body()
    body: {
      preferences?: Array<{ notificationType: string } & Record<string, unknown>>;
    },
  ) {
    return this.notificationsService.syncUserPreferences(
      userId,
      (body.preferences || []) as any,
    );
  }

  @Get('preferences/:userId/simple')
  getSimplePreferences(@Param('userId') userId: string) {
    return this.notificationsService.getSimplePreferences(userId);
  }

  @Put('preferences/:userId/simple')
  updateSimplePreferences(
    @Param('userId') userId: string,
    @Body()
    body: {
      enabled: boolean;
      process: boolean;
      actionPoint: boolean;
      ticket: boolean;
      learning: boolean;
    },
  ) {
    return this.notificationsService.updateSimplePreferences(userId, body);
  }

  @Post('delivery-logs')
  createDeliveryLog(@Body() body: Record<string, unknown>) {
    return this.notificationsService.createDeliveryLog(body);
  }

  @Put('delivery-logs/:id/status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: string; errorMessage?: string },
  ) {
    return this.notificationsService.updateDeliveryStatus(
      id,
      body.status,
      body.errorMessage,
    );
  }

  @Post('templates')
  createTemplate(@Body() body: Record<string, unknown>) {
    return this.notificationsService.createEmailTemplate(body);
  }

  @Get('templates/:name')
  findTemplate(@Param('name') name: string) {
    return this.notificationsService.findTemplateByName(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
