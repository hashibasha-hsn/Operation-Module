import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('entity_tags')
export class EntityTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tag_name', length: 255 })
  tagName: string;

  @Column({ name: 'tag_values', type: 'jsonb', nullable: true })
  tagValues: string[];

  @Column({ length: 10, default: 'NO' })
  mandatory: string;

  @Column({ name: 'organization_id', length: 255, default: 'default-org' })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
