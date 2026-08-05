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

  @Column({ length: 50, default: 'draft' })
  publishStatus: string; // draft, published, archived

  @Column({ type: 'json', nullable: true })
  customFields: any; // Array of custom field definitions

  @Column({ type: 'json', nullable: true })
  renewalReminderConfig: any; // Array of {field, daysBefore, channel, enabled}

  @Column({ type: 'json', nullable: true })
  viewRoles: string[]; // role ids allowed to view when assignmentType=limited

  @Column({ type: 'json', nullable: true })
  editRoles: string[]; // role ids allowed to edit

  @Column({ default: false })
  lockTableOperations: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

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
