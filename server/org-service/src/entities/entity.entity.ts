import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('entities')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  storeName: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ length: 100, unique: true, nullable: true })
  entityId: string;

  @Column({ length: 50, default: 'Functional' })
  storeStatus: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ nullable: true, type: 'integer' })
  staff: number;

  @Column({ default: true })
  status: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0.00000000 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0.00000000 })
  longitude: number;

  @Column({ default: 100, type: 'integer' })
  storeRadius: number;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
