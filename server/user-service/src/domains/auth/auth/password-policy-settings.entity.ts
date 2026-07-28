import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Platform-wide password rotation / expiry policy (singleton via scopeKey). */
@Entity('password_policy_settings')
export class PasswordPolicySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, default: 'default' })
  scopeKey: string;

  /** Days after which users must change password. 0 = never expire. */
  @Column({ type: 'int', default: 90 })
  passwordExpiryDays: number;

  /** Days before expiry to flag a soft warning on login. */
  @Column({ type: 'int', default: 7 })
  warnBeforeExpiryDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
