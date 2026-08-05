import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('asset_filters')
export class AssetFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'json', nullable: true })
  criteria: any; // { search, status, condition, storeId, userId, tableId, expiryFrom, expiryTo, customFields }

  @Column({ length: 50, default: 'private' })
  visibility: string; // private, shared

  @Column({ nullable: true })
  createdBy: string;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
