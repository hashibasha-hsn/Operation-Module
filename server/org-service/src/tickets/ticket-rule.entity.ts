import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ticket_rules')
export class TicketRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  ruleType: string; // 'completed_at', 'created_at'

  @Column({ type: 'json', nullable: true })
  targetStatuses: string[]; // Statuses to apply rule to

  @Column({ type: 'int', nullable: true })
  daysAfter: number; // Number of days after event

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
