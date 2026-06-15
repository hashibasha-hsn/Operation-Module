import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowType: string; // 'process' or 'audit'

  @Column()
  workflowId: string;

  @Column()
  storeId: string;

  @Column()
  submittedBy: string;

  @Column({ default: 'new' })
  status: string; // 'new', 'correction', 'completed', 'rejected'

  @Column({ type: 'json', nullable: true })
  answers: any; // Answers to questions

  @Column({ type: 'json', nullable: true })
  attachments: any; // File attachments

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  score: number; // For audits

  @Column({ default: false })
  passed: boolean; // For audits

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'json', nullable: true })
  reviewHistory: any; // Track review levels and actions

  @Column({ default: 0 })
  currentReviewLevel: number;

  @Column()
  organizationId: string;

  @ManyToOne(() => Process, { nullable: true })
  @JoinColumn({ name: 'workflowId' })
  process: Process;

  @ManyToOne(() => Audit, { nullable: true })
  @JoinColumn({ name: 'workflowId' })
  audit: Audit;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
