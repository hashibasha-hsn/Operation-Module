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

  @Column({ name: 'assigneeids', type: 'json', nullable: true })
  assigneeIds: string[];

  @Column({ name: 'storeids', type: 'json', nullable: true })
  storeIds: string[];

  @Column({ type: 'json', nullable: true })
  properties: Record<string, unknown>;

  @Column({ name: 'certificatesettings', type: 'json', nullable: true })
  certificateSettings: Record<string, unknown>;

  @Column({ name: 'startdate', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ default: true })
  visible: boolean;

  @Column({ name: 'showresult', default: false })
  showResult: boolean;

  @Column({ name: 'showcorrectanswer', default: false })
  showCorrectAnswer: boolean;

  @Column({ name: 'dynamicassignment', default: false })
  dynamicAssignment: boolean;

  @Column({ name: 'generatecertificate', default: false })
  generateCertificate: boolean;

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

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
