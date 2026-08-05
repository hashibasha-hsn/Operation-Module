import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 'direct' = 1-on-1 DM, 'channel' = multi-member group */
  @Column({ name: 'type', length: 20 })
  type: 'direct' | 'channel';

  @Column({ name: 'name', length: 255, nullable: true })
  name?: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'created_by', length: 255, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'organization_id', length: 255 })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}