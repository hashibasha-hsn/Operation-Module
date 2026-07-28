import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaRegion } from './sa-region.entity';
import { SaDistrict } from './sa-district.entity';

@Entity('sa_cities')
export class SaCity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'region_id' })
  regionId: string;

  @ManyToOne(() => SaRegion, (region) => region.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'region_id' })
  region: SaRegion;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'name_ar', length: 100, nullable: true })
  nameAr: string;

  @Column({ length: 10, nullable: true })
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

  @OneToMany(() => SaDistrict, (district) => district.city)
  districts: SaDistrict[];
}
