import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('permission_audit_logs')
export class PermissionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // GRANT, REVOKE, MODIFY

  @Column()
  resourceType: string; // ROLE, PERMISSION, SCOPE

  @Column()
  resourceId: string;

  @Column({ nullable: true, type: 'text' })
  oldValue: string;

  @Column({ nullable: true, type: 'text' })
  newValue: string;

  @Column()
  performedBy: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
