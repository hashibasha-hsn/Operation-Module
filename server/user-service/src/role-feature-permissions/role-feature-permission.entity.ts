import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
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
  @JoinColumn({ name: 'roleId' })
  role: SystemRole;

  @ManyToOne(() => Feature)
  @JoinColumn({ name: 'featureId' })
  feature: Feature;
}
