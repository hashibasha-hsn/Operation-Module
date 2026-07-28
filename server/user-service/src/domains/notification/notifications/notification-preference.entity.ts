import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export type EmailFrequency = 'instant' | 'daily' | 'weekly' | 'urgent_only' | 'off';

@Entity('notification_preferences')
@Unique(['userId', 'notificationType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  /** e.g. _global, task_reminder, deadline_alert, mention, weekly_digest */
  @Column()
  notificationType: string;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ default: true })
  inAppEnabled: boolean;

  /** How often email notifications are delivered for this preference scope. */
  @Column({ default: 'instant' })
  emailFrequency: EmailFrequency;

  /** When true, SMS is limited to high-priority notifications only. */
  @Column({ default: true })
  smsUrgentOnly: boolean;

  @Column({ default: true })
  pushDesktopEnabled: boolean;

  @Column({ default: true })
  pushMobileEnabled: boolean;

  @Column({ default: true })
  inAppSoundEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
