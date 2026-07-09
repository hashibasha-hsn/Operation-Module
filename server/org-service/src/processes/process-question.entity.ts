import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProcessSection } from './process-section.entity';

@Entity('process_questions')
export class ProcessQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  questionText: string;

  @Column({ length: 50 })
  questionType: string; // 'text', 'number', 'yes_no', 'multiple_choice', 'dropdown', 'date', 'time', 'photo', 'file', 'rating'

  @Column({ type: 'json', nullable: true })
  options: any; // For multiple choice, dropdown, rating options

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

  @Column()
  sectionId: string;

  @ManyToOne(() => ProcessSection, (section) => section.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: ProcessSection;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
