import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  target: string;

  @Column({ length: 50 })
  operation: string;

  @Column()
  performedBy: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, unknown>;

  @Column({ nullable: true })
  targetId: string;

  @Column({ default: 'default-org' })
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;
}
