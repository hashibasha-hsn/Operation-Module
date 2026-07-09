import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('assessment_results')
export class AssessmentResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assessmentId: string;

  @Column()
  userId: string;

  @Column({ type: 'json', nullable: true })
  answers: any; // User's answers

  @Column({ default: 0 })
  score: number; // Score achieved

  @Column({ default: 0 })
  percentage: number; // Percentage score

  @Column({ default: false })
  passed: boolean; // Whether the user passed

  @Column({ default: 'completed' })
  status: string; // 'completed', 'pending', 'in_progress'

  @Column({ default: 1 })
  attemptNumber: number; // Attempt number

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'int', nullable: true })
  timeTaken: number; // Time taken in seconds

  @Column({ nullable: true })
  storeId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Assessment)
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
