import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { UserProfile } from '../profiles/user-profile.entity';

@Entity('adv_dropdown_values')
export class AdvDropdownValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  value: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  tagId: string;

  @ManyToOne(() => AdvDropdownTag, (tag) => tag.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: AdvDropdownTag;

  @ManyToMany(() => UserProfile)
  @JoinTable({
    name: 'adv_dropdown_value_assignees',
    joinColumn: { name: 'valueId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  assignees: UserProfile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
