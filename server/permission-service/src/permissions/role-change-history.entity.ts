import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('role_change_history')
export class RoleChangeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  orgId: string;

  @Column()
  oldRoleId: string;

  @Column()
  newRoleId: string;

  @Column()
  changedBy: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
