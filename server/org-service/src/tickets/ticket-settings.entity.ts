import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
