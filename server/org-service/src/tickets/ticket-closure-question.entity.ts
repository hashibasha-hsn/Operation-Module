import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ticket_closure_questions')
export class TicketClosureQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  questionText: string;

  @Column({ length: 50, default: 'text' })
  questionType: string; // 'text' | 'yes_no' | 'dropdown'

  @Column({ type: 'json', nullable: true })
  options: string[];

  @Column({ default: true })
  isRequired: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
