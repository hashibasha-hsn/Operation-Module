import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { SystemRole } from '../system-roles/system-role.entity';
import { Feature } from '../features/feature.entity';

@Entity('role_feature_permissions')
@Unique(['roleId', 'featureId'])
export class RoleFeaturePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roleId: string;

  @Column()
  featureId: string;

  @Column({ length: 20 })
  permissionLevel: string; // 'read', 'write', 'delete', 'admin'

  @CreateDateColumn()
  grantedAt: Date;

  @ManyToOne(() => SystemRole)
  @JoinColumn({ name: 'role_id' })
  role: SystemRole;

  @ManyToOne(() => Feature)
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
