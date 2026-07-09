import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Designation } from '../designations/designation.entity';
import { SystemRole } from '../system-roles/system-role.entity';

@Entity('designation_role_mapping')
@Unique(['designationId', 'organizationId'])
export class DesignationRoleMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  designationId: string;

  @Column()
  systemRoleId: string;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  mappedAt: Date;

  @Column({ nullable: true })
  mappedBy: string;

  @ManyToOne(() => Designation)
  @JoinColumn({ name: 'designation_id' })
  designation: Designation;

  @ManyToOne(() => SystemRole)
  @JoinColumn({ name: 'system_role_id' })
  systemRole: SystemRole;
}
