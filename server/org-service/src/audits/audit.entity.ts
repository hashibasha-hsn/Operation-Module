import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  processTag: string;

  @Column({ default: 'draft' })
  status: string; // 'draft', 'published', 'archived'

  @Column({ nullable: true, length: 50 })
  frequency: string; // 'daily', 'weekly', 'monthly', 'custom', 'one-time'

  @Column({ type: 'json', nullable: true })
  frequencyConfig: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ type: 'json', nullable: true })
  visibilityRules: any;

  @Column({ type: 'json', nullable: true })
  reminderConfig: any;

  // Audit-specific fields
  @Column({ type: 'json', nullable: true })
  scoringConfig: any; // Section-wise scoring rules

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  passThreshold: number; // Minimum score to pass

  @Column({ default: 1 })
  reviewLevels: number; // Number of review levels (L1, L2, etc.)

  @Column({ type: 'simple-array', default: [] })
  criticalQuestionIds: string[]; // IDs of critical questions

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'simple-array', default: [] })
  assigneeIds: string[];

  @Column({ type: 'simple-array', default: [] })
  storeIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
