import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AuditSection } from './audit-section.entity';

@Entity('audit_questions')
export class AuditQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  questionText: string;

  @Column({ length: 50 })
  questionType: string; // 'text', 'number', 'yes_no', 'multiple_choice', 'dropdown', 'date', 'time', 'photo', 'file', 'rating'

  @Column({ type: 'json', nullable: true })
  options: any;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: 'json', nullable: true })
  validationRules: any;

  @Column({ type: 'json', nullable: true })
  conditionalLogic: any;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  // Audit-specific fields
  @Column({ default: false })
  isCritical: boolean; // Critical question that can trigger escalation

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  maxScore: number; // Maximum score for this question

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  weight: number; // Weight of this question in section score

  @Column()
  sectionId: string;

  @ManyToOne(() => AuditSection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: AuditSection;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
