import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hybrid_assignee_profiles')
export class HybridAssigneeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'organizationid' })
  organizationId: string;

  @Column({ name: 'isactive', default: true })
  isActive: boolean;

  @Column({ name: 'ispublished', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;
}
