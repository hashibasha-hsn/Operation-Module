import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'PENDING' })
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DUMMY';

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  /** Set whenever the password hash is created or changed (rotation policy). */
  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorOtpHash: string;

  @Column({ type: 'timestamp', nullable: true })
  twoFactorOtpExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  twoFactorOtpRequestedAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
