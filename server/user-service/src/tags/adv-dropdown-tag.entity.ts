import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AdvDropdownValue } from './adv-dropdown-value.entity';

@Entity('adv_dropdown_tags')
export class AdvDropdownTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  rootTagName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @OneToMany(() => AdvDropdownValue, (value) => value.tag, { cascade: true })
  values: AdvDropdownValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
