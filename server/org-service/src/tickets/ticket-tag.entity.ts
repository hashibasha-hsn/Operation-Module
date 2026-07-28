import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ticket_tags')
export class TicketTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  tagName: string;

  @Column({ length: 50 })
  tagType: string; // 'ticket', 'asset', 'both'

  @Column({ type: 'json', nullable: true })
  tagValues: any; // Dropdown options

  @Column({ default: false })
  isMandatory: boolean;

  @Column({ default: true })
  isActive: boolean;

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
