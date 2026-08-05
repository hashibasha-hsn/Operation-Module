import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'open' })
  status: string; // 'open', 'in_progress', 'on_hold', 'complete', 'closed', 'rejected'

  @Column({ length: 50, default: 'medium' })
  priority: string; // 'highest', 'high', 'medium', 'low', 'lowest'

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column()
  storeId: string;

  @Column()
  assignedTo: string;

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  assignedTeamId: string;

  @Column({ nullable: true })
  categoryId: string; // For auto tickets

  @Column({ nullable: true })
  assetId: string; // Linked asset (Asset Management module)

  @Column({ default: 'custom' })
  ticketType: string; // 'custom' or 'auto'

  @Column({ type: 'json', nullable: true })
  tags: any; // Applied tags

  @Column({ type: 'json', nullable: true })
  attachments: any;

  @Column({ type: 'json', nullable: true })
  comments: any[];

  @Column({ type: 'json', nullable: true })
  costs: any; // Cost information

  @Column({ type: 'json', nullable: true })
  closureAnswers: any; // Answers to closure questions

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'json', nullable: true })
  actionHistory: any[]; // Track all actions on the ticket

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
