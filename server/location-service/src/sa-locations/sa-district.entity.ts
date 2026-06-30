import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaCity } from './sa-city.entity';

@Entity('sa_districts')
export class SaDistrict {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'city_id' })
  cityId: string;

  @ManyToOne(() => SaCity, (city) => city.districts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city: SaCity;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100, nullable: true })
  nameAr: string;

  @Column({ length: 10, nullable: true })
  code: string;

  @Column({ name: 'postal_code', length: 10, nullable: true })
  postalCode: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', length: 255, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
