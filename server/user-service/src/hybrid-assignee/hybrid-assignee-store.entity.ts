import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
