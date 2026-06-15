import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Audit } from './audit.entity';

@Entity('audit_sections')
export class AuditSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  // Audit-specific fields
  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  maxScore: number;

  @Column({ type: 'decimal', nullable: true, precision: 5, scale: 2 })
  weight: number;

  @Column()
  auditId: string;

  @ManyToOne(() => Audit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditId' })
  audit: Audit;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
