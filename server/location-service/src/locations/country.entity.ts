import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { State } from './state.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** English name */
  @Column({ length: 150 })
  name: string;

  /** Arabic name */
  @Column({ name: 'name_ar', length: 150, nullable: true })
  nameAr: string;

  /** ISO 3166-1 alpha-2 code, e.g. "SA" */
  @Column({ length: 10, unique: true, nullable: true })
  code: string;

  /** ISO 3166-1 alpha-3 code, e.g. "SAU" */
  @Column({ name: 'code3', length: 10, unique: true, nullable: true })
  code3: string;

  /** Dial / phone prefix, e.g. "+966" */
  @Column({ name: 'phone_code', length: 10, nullable: true })
  phoneCode: string;

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

  @OneToMany(() => State, (state) => state.country)
  states: State[];
}
