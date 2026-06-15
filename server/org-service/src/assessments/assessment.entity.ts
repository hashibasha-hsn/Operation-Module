import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AssessmentResult } from './assessment-result.entity';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  questions: any[]; // Array of questions

  @Column({ default: 0 })
  passingScore: number; // Minimum score to pass

  @Column({ default: 0 })
  duration: number; // Duration in minutes

  @Column({ default: 'draft' })
  status: string; // 'draft', 'published', 'archived'

  @Column({ type: 'json', nullable: true })
  assigneeProfiles: any; // Store, designation, etc.

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: false })
  allowRetake: boolean;

  @Column({ default: 0 })
  maxAttempts: number; // Maximum number of attempts

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @OneToMany(() => AssessmentResult, (result) => result.assessment)
  assessmentResults: AssessmentResult[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
