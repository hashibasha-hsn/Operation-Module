import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaCity } from './sa-city.entity';

@Entity('sa_region')
export class SaRegion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100, nullable: true })
  nameAr: string;

  @Column({ length: 10, unique: true, nullable: true })
  code: string;

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

  @OneToMany(() => SaCity, (city) => city.region)
  cities: SaCity[];
}
