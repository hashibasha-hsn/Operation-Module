import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Scheduled snapshot-report email settings (one row per organization). */
@Entity('snapshot_email_settings')
export class SnapshotEmailSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  organizationId: string;

  @Column({ default: false })
  enabled: boolean;

  /** 'daily' | 'weekly' | 'monthly' */
  @Column({ length: 20, default: 'daily' })
  frequency: string;

  /** Local time "HH:mm" at which the snapshot email is sent. */
  @Column({ length: 5, default: '09:00' })
  timeOfDay: string;

  /** Newline or comma separated recipient emails. */
  @Column({ type: 'text', nullable: true })
  recipients: string | null;

  /** Snapshot date filter used when generating the email (null = today). */
  @Column({ length: 20, nullable: true })
  snapshotDate: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
