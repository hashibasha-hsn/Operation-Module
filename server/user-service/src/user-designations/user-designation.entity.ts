import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Designation } from '../designations/designation.entity';

@Entity('user_designations')
@Unique(['userId', 'organizationId', 'isPrimary'])
export class UserDesignation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  designationId: string;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ nullable: true })
  assignedBy: string;

  @Column({ default: true })
  isPrimary: boolean;

  @ManyToOne(() => Designation)
  @JoinColumn({ name: 'designation_id' })
  designation: Designation;
}
