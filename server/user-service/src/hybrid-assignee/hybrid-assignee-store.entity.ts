import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hybrid_assignee_stores')
export class HybridAssigneeStore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organizationid' })
  organizationId: string;

  @Column({ name: 'storeid' })
  storeId: string;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;
}
