import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('auto_ticket_categories')
export class AutoTicketCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  categoryName: string;

  @Column({ nullable: true })
  parentId: string; // For category tree structure

  @Column({ type: 'json', nullable: true })
  assigneeIds: string[];

  @Column({ type: 'json', nullable: true })
  teamIds: string[];

  @Column({ length: 50, default: 'medium' })
  priority: string;

  @Column({ type: 'json', nullable: true })
  dueDateConfig: any; // Due date configuration

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
