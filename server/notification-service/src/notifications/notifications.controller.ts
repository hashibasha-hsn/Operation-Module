import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: any) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.notificationsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('delivery-logs')
  createDeliveryLog(@Body() createDeliveryLogDto: any) {
    return this.notificationsService.createDeliveryLog(createDeliveryLogDto);
  }

  @Put('delivery-logs/:id/status')
  updateDeliveryStatus(@Param('id') id: string, @Body('status') status: string, @Body('errorMessage') errorMessage?: string) {
    return this.notificationsService.updateDeliveryStatus(id, status, errorMessage);
  }

  @Post('email-templates')
  createEmailTemplate(@Body() createTemplateDto: any) {
    return this.notificationsService.createEmailTemplate(createTemplateDto);
  }

  @Get('email-templates/:name')
  findTemplateByName(@Param('name') name: string) {
    return this.notificationsService.findTemplateByName(name);
  }

  @Get('preferences/:userId')
  getUserPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  @Put('preferences/:userId/:notificationType')
  updatePreferences(@Param('userId') userId: string, @Param('notificationType') notificationType: string, @Body() preferences: any) {
    return this.notificationsService.updatePreferences(userId, notificationType, preferences);
  }
}
