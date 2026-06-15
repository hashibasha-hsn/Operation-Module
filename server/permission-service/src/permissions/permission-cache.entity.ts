import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('permission_cache')
@Index(['userId', 'orgId'])
export class PermissionCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  orgId: string;

  @Column()
  roleId: string;

  @Column({ type: 'jsonb' })
  permissions: any; // Cached permissions for fast lookup

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
