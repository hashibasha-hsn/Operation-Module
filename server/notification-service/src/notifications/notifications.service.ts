import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { DeliveryLog } from './delivery-log.entity';
import { EmailTemplate } from './email-template.entity';
import { NotificationPreference } from './notification-preference.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(DeliveryLog)
    private readonly deliveryLogRepository: Repository<DeliveryLog>,
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(NotificationPreference)
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
  ) {}

  async createNotification(createNotificationDto: any): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);
    return Array.isArray(savedNotification) ? savedNotification[0] : savedNotification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Notification> {
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, { 
      status: 'READ',
      readAt: new Date()
    });
    return await this.findOne(id);
  }

  async createDeliveryLog(createDeliveryLogDto: any): Promise<DeliveryLog> {
    const deliveryLog = this.deliveryLogRepository.create(createDeliveryLogDto);
    const savedDeliveryLog = await this.deliveryLogRepository.save(deliveryLog);
    return Array.isArray(savedDeliveryLog) ? savedDeliveryLog[0] : savedDeliveryLog;
  }

  async updateDeliveryStatus(id: string, status: string, errorMessage?: string): Promise<DeliveryLog> {
    await this.deliveryLogRepository.update(id, { 
      status,
      errorMessage,
      sentAt: status === 'SENT' ? new Date() : null,
      deliveredAt: status === 'DELIVERED' ? new Date() : null
    });
    return await this.deliveryLogRepository.findOne({ where: { id } });
  }

  async createEmailTemplate(createTemplateDto: any): Promise<EmailTemplate> {
    const template = this.emailTemplateRepository.create(createTemplateDto);
    const savedTemplate = await this.emailTemplateRepository.save(template);
    return Array.isArray(savedTemplate) ? savedTemplate[0] : savedTemplate;
  }

  async findTemplateByName(name: string): Promise<EmailTemplate> {
    return await this.emailTemplateRepository.findOne({ where: { name } });
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    return await this.notificationPreferenceRepository.find({ where: { userId } });
  }

  async updatePreferences(userId: string, notificationType: string, preferences: any): Promise<NotificationPreference> {
    const existing = await this.notificationPreferenceRepository.findOne({
      where: { userId, notificationType }
    });

    if (existing) {
      await this.notificationPreferenceRepository.update(existing.id, preferences);
      return await this.notificationPreferenceRepository.findOne({ where: { id: existing.id } });
    }

    const newPreference = this.notificationPreferenceRepository.create({
      userId,
      notificationType,
      ...preferences
    });
    const savedPreference = await this.notificationPreferenceRepository.save(newPreference);
    return Array.isArray(savedPreference) ? savedPreference[0] : savedPreference;
  }
}
