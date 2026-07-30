import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { DeliveryLog } from './delivery-log.entity';
import { EmailTemplate } from './email-template.entity';
import { NotificationPreference } from './notification-preference.entity';
import {
  GLOBAL_PREFERENCE_TYPE,
  WEEKLY_DIGEST_TYPE,
  PROCESS_ASSIGNED_TYPE,
  ACTION_POINT_ASSIGNED_TYPE,
  TICKET_ASSIGNED_TYPE,
  LEARNING_ASSIGNMENT_TYPE,
  buildDefaultPreferences,
} from './notification-preferences.defaults';

type PreferenceUpdate = Partial<
  Pick<
    NotificationPreference,
    | 'emailEnabled'
    | 'pushEnabled'
    | 'smsEnabled'
    | 'inAppEnabled'
    | 'emailFrequency'
    | 'smsUrgentOnly'
    | 'pushDesktopEnabled'
    | 'pushMobileEnabled'
    | 'inAppSoundEnabled'
  >
>;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification, 'notification')
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(DeliveryLog, 'notification')
    private readonly deliveryLogRepository: Repository<DeliveryLog>,
    @InjectRepository(EmailTemplate, 'notification')
    private readonly emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(NotificationPreference, 'notification')
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
  ) {}

  private mergeWithDefaults(
    userId: string,
    stored: NotificationPreference[],
  ): NotificationPreference[] {
    const byType = new Map(stored.map((pref) => [pref.notificationType, pref]));
    const defaults = buildDefaultPreferences(userId);

    return defaults.map((defaultPref) => {
      const existing = byType.get(defaultPref.notificationType);
      return existing
        ? { ...defaultPref, ...existing }
        : this.notificationPreferenceRepository.create(defaultPref);
    });
  }

  private channelEnabled(pref: NotificationPreference | undefined, deliveryMethod?: string): boolean {
    if (!pref) return true;
    const method = String(deliveryMethod || 'IN_APP').toUpperCase();
    if (method === 'EMAIL') return pref.emailEnabled;
    if (method === 'SMS') return pref.smsEnabled;
    if (method === 'PUSH') return pref.pushEnabled;
    return pref.inAppEnabled;
  }

  async shouldDeliverNotification(input: {
    userId: string;
    type: string;
    priority?: string;
    deliveryMethod?: string;
  }): Promise<boolean> {
    const prefs = await this.getUserPreferences(input.userId);
    const globalPref = prefs.find((pref) => pref.notificationType === GLOBAL_PREFERENCE_TYPE);
    const typePref = prefs.find((pref) => pref.notificationType === input.type);

    if (!this.channelEnabled(globalPref, input.deliveryMethod)) return false;
    if (typePref && !this.channelEnabled(typePref, input.deliveryMethod)) return false;

    const method = String(input.deliveryMethod || 'IN_APP').toUpperCase();
    const priority = String(input.priority || 'NORMAL').toUpperCase();

    if (method === 'EMAIL' && globalPref) {
      if (!globalPref.emailEnabled) return false;
      const frequency =
        input.type === WEEKLY_DIGEST_TYPE && typePref?.emailFrequency
          ? typePref.emailFrequency
          : globalPref.emailFrequency || 'instant';
      if (frequency === 'off') return false;
      if (frequency === 'urgent_only' && priority !== 'HIGH') return false;
      if (input.type !== WEEKLY_DIGEST_TYPE && (frequency === 'daily' || frequency === 'weekly')) {
        // Batched digests are queued separately; skip immediate email delivery.
        return false;
      }
    }

    if (method === 'SMS' && globalPref?.smsUrgentOnly && priority !== 'HIGH') {
      return false;
    }

    return true;
  }

  async createNotification(createNotificationDto: any): Promise<Notification | null> {
    const allowed = await this.shouldDeliverNotification({
      userId: createNotificationDto.userId,
      type: createNotificationDto.type,
      priority: createNotificationDto.priority,
      deliveryMethod: createNotificationDto.deliveryMethod,
    });

    if (!allowed) {
      return null;
    }

    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);
    return Array.isArray(savedNotification) ? savedNotification[0] : savedNotification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, {
      status: 'READ',
      readAt: new Date(),
    });
    return await this.findOne(id);
  }

  async createDeliveryLog(createDeliveryLogDto: any): Promise<DeliveryLog> {
    const deliveryLog = this.deliveryLogRepository.create(createDeliveryLogDto);
    const savedDeliveryLog = await this.deliveryLogRepository.save(deliveryLog);
    return Array.isArray(savedDeliveryLog) ? savedDeliveryLog[0] : savedDeliveryLog;
  }

  async updateDeliveryStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<DeliveryLog> {
    await this.deliveryLogRepository.update(id, {
      status,
      errorMessage,
      sentAt: status === 'SENT' ? new Date() : null,
      deliveredAt: status === 'DELIVERED' ? new Date() : null,
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
    const stored = await this.notificationPreferenceRepository.find({ where: { userId } });
    return this.mergeWithDefaults(userId, stored);
  }

  async updatePreferences(
    userId: string,
    notificationType: string,
    preferences: PreferenceUpdate,
  ): Promise<NotificationPreference> {
    const existing = await this.notificationPreferenceRepository.findOne({
      where: { userId, notificationType },
    });

    if (existing) {
      await this.notificationPreferenceRepository.update(existing.id, preferences);
      return await this.notificationPreferenceRepository.findOne({ where: { id: existing.id } });
    }

    const defaults = buildDefaultPreferences(userId).find(
      (pref) => pref.notificationType === notificationType,
    );
    const newPreference = this.notificationPreferenceRepository.create({
      ...(defaults || { userId, notificationType }),
      ...preferences,
      userId,
      notificationType,
    });
    const savedPreference = await this.notificationPreferenceRepository.save(newPreference);
    return Array.isArray(savedPreference) ? savedPreference[0] : savedPreference;
  }

  async syncUserPreferences(
    userId: string,
    preferences: Array<{ notificationType: string } & PreferenceUpdate>,
  ): Promise<NotificationPreference[]> {
    for (const pref of preferences) {
      const { notificationType, ...updates } = pref;
      await this.updatePreferences(userId, notificationType, updates);
    }
    return this.getUserPreferences(userId);
  }

  async getSimplePreferences(userId: string): Promise<{
    enabled: boolean;
    process: boolean;
    actionPoint: boolean;
    ticket: boolean;
    learning: boolean;
  }> {
    const prefs = await this.getUserPreferences(userId);
    const byType = new Map(prefs.map((p) => [p.notificationType, p]));
    return {
      enabled: byType.get(GLOBAL_PREFERENCE_TYPE)?.inAppEnabled ?? true,
      process: byType.get(PROCESS_ASSIGNED_TYPE)?.inAppEnabled ?? true,
      actionPoint: byType.get(ACTION_POINT_ASSIGNED_TYPE)?.inAppEnabled ?? true,
      ticket: byType.get(TICKET_ASSIGNED_TYPE)?.inAppEnabled ?? true,
      learning: byType.get(LEARNING_ASSIGNMENT_TYPE)?.inAppEnabled ?? true,
    };
  }

  async updateSimplePreferences(
    userId: string,
    body: {
      enabled: boolean;
      process: boolean;
      actionPoint: boolean;
      ticket: boolean;
      learning: boolean;
    },
  ): Promise<{
    enabled: boolean;
    process: boolean;
    actionPoint: boolean;
    ticket: boolean;
    learning: boolean;
  }> {
    await this.updatePreferences(userId, GLOBAL_PREFERENCE_TYPE, { inAppEnabled: body.enabled });
    await this.updatePreferences(userId, PROCESS_ASSIGNED_TYPE, { inAppEnabled: body.process });
    await this.updatePreferences(userId, ACTION_POINT_ASSIGNED_TYPE, { inAppEnabled: body.actionPoint });
    await this.updatePreferences(userId, TICKET_ASSIGNED_TYPE, { inAppEnabled: body.ticket });
    await this.updatePreferences(userId, LEARNING_ASSIGNMENT_TYPE, { inAppEnabled: body.learning });
    return body;
  }
}
