import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Role, RoleName } from '../roles/role.entity';

@Entity('org_memberships')
@Unique(['userId', 'orgId'])
export class OrgMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  orgId: string;

  @Column()
  roleId: string;

  @Column({ nullable: true })
  scopeId: string; // For regional/store-level scoping

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
