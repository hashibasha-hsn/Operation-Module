import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  assetName: string;

  @Column({ length: 100, nullable: true })
  customAssetId: string;

  @Column({ nullable: true })
  tableId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  ownerUserId: string;

  @Column({ nullable: true })
  storeId: string;

  @Column({ length: 50, default: 'active' })
  status: string; // draft, active, inactive, maintenance, retired, disposed

  @Column({ length: 50, nullable: true, default: 'good' })
  condition: string; // excellent, good, fair, poor

  @Column({ type: 'json', nullable: true })
  customFields: any;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  renewalDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: 'float', nullable: true, default: 0 })
  utilizationPercent: number;

  @Column({ type: 'json', nullable: true })
  photoUrls: string[];

  @Column({ type: 'json', nullable: true })
  fileUrls: any[];

  @Column({ type: 'json', nullable: true })
  ticketIds: string[];

  @Column({ type: 'json', nullable: true })
  previousOwners: any[];

  @Column({ type: 'json', nullable: true })
  history: any[];

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
