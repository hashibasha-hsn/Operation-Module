import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PriorityLevelConfig } from './ticket-priority.defaults';

@Entity('ticket_settings')
export class TicketSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  organizationId: string;

  @Column({ default: false })
  attachmentMandatory: boolean;

  @Column({ default: false })
  disableTicketDelete: boolean;

  @Column({ default: false })
  hidePriorities: boolean;

  @Column({ type: 'json', nullable: true })
  priorityLevels: PriorityLevelConfig[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
