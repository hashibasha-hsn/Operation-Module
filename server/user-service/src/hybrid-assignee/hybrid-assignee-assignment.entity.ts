import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const HYBRID_ASSIGNMENT_TYPES = {
  INDIVIDUAL: 'individual',
  BULK: 'bulk',
  DESIGNATION: 'designation',
  COMMON: 'common',
} as const;

export type HybridAssignmentType =
  (typeof HYBRID_ASSIGNMENT_TYPES)[keyof typeof HYBRID_ASSIGNMENT_TYPES];

@Entity('hybrid_assignee_assignments')
export class HybridAssigneeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profileid' })
  profileId: string;

  @Column({ name: 'userid', type: 'varchar', nullable: true })
  userId: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ name: 'storeid', nullable: true })
  storeId: string;

  @Column({ name: 'assignmenttype' })
  assignmentType: string;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
