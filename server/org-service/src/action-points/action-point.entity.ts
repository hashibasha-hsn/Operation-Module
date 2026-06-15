import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Submission } from '../submissions/submission.entity';

@Entity('action_points')
export class ActionPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'open' })
  status: string; // 'open', 'in_progress', 'on_hold', 'completed', 'closed', 'rejected'

  @Column({ length: 50, default: 'medium' })
  priority: string; // 'low', 'medium', 'high'

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column()
  assignedTo: string;

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  closureAssignedTo: string;

  @Column({ default: 'manual' })
  triggerType: string; // 'manual' or 'auto'

  @Column({ nullable: true })
  submissionId: string;

  @Column({ nullable: true })
  questionId: string;

  @Column({ nullable: true })
  workflowType: string; // 'process' or 'audit'

  @Column({ nullable: true })
  workflowId: string;

  @Column({ nullable: true })
  storeId: string;

  @Column({ type: 'json', nullable: true })
  autoTriggerConfig: any; // Configuration for auto-trigger

  @Column({ type: 'json', nullable: true })
  attachments: any;

  @Column({ type: 'json', nullable: true })
  comments: any[];

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column()
  organizationId: string;

  @ManyToOne(() => Submission, { nullable: true })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
