import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { State } from './state.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'state_id' })
  stateId: string;

  @ManyToOne(() => State, (state) => state.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'state_id' })
  state: State;

  /** English name */
  @Column({ length: 150 })
  name: string;

  /** Arabic name */
  @Column({ name: 'name_ar', length: 150, nullable: true })
  nameAr: string;

  /** Optional city/postal code */
  @Column({ length: 20, nullable: true })
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
}
