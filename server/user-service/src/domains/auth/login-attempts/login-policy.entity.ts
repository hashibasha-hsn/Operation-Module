import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Platform-wide login lockout policy (singleton via scopeKey). */
@Entity('login_policy_settings')
export class LoginPolicySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, default: 'default' })
  scopeKey: string;

  /** Max consecutive failed login attempts before the account is locked. */
  @Column({ type: 'int', default: 5 })
  maxFailedAttempts: number;

  /** Hours the account stays locked after reaching maxFailedAttempts. */
  @Column({ type: 'int', default: 24 })
  lockoutHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
