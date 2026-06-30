import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ProcessSection } from './process-section.entity';

@Entity('processes')
export class Process {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  processTag: string;

  @Column({ type: 'json', nullable: true })
  processTags: string[];

  @Column({ default: 'draft' })
  status: string; // 'draft', 'published', 'archived'

  @Column({ nullable: true, length: 50 })
  frequency: string; // 'daily', 'weekly', 'monthly', 'custom'

  @Column({ type: 'json', nullable: true })
  frequencyConfig: any; // For custom frequency settings

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ type: 'json', nullable: true })
  visibilityRules: any;

  @Column({ type: 'json', nullable: true })
  reminderConfig: any;

  @Column({ type: 'json', nullable: true })
  properties: any;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'simple-array', default: [] })
  assigneeIds: string[];

  @Column({ type: 'simple-array', default: [] })
  storeIds: string[];

  @OneToMany(() => ProcessSection, (section) => section.process, { cascade: true })
  sections: ProcessSection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
