import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('asset_tables')
export class AssetTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  tableName: string;

  @Column({ length: 50, default: 'global' })
  assignmentType: string; // 'global' or 'limited'

  @Column({ default: false })
  enableCustomAssetId: boolean;

  @Column({ type: 'json', nullable: true })
  customFields: any; // Array of custom field definitions

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
