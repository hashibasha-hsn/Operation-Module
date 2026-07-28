import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { UserProfile } from '../profiles/user-profile.entity';

@Entity('assignee_profiles')
export class AssigneeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  profileName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @ManyToMany(() => UserProfile)
  @JoinTable({
    name: 'assignee_profile_users',
    joinColumn: { name: 'profileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: UserProfile[];

  @Column({ type: 'simple-array', default: [] })
  storeIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
