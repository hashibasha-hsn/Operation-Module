import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('removed_entities')
export class RemovedEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'store_name', length: 255 })
  storeName: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ name: 'entity_id', length: 100, nullable: true })
  entityId: string;

  @Column({ name: 'store_status', length: 50, nullable: true })
  storeStatus: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ nullable: true, type: 'integer' })
  staff: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0.00000000 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0.00000000 })
  longitude: number;

  @Column({ name: 'store_radius', default: 100, type: 'integer' })
  storeRadius: number;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: any;

  @CreateDateColumn({ name: 'removed_at' })
  removedAt: Date;

  @Column({ name: 'original_created_at', nullable: true })
  originalCreatedAt: Date;
}
