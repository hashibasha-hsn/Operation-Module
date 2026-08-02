import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userid', unique: true })
  userId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'password', nullable: true })
  password: string;

  @Column({ name: 'employeeid', nullable: true })
  employeeId: string;

  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Column({ name: 'countrycode', nullable: true })
  countryCode: string;

  @Column({ name: 'entityid', type: 'uuid', nullable: true })
  entityId: string;

  @Column({ name: 'designation', nullable: true })
  designation: string;

  @Column({ name: 'manager', nullable: true })
  manager: string;

  @Column({ name: 'validemail', default: false })
  validEmail: boolean;

  @Column({ name: 'isactive', default: true })
  isActive: boolean;

  @Column({ name: 'isremoved', default: false })
  isRemoved: boolean;

  @Column({ name: 'storename', nullable: true })
  storeName: string;

  @Column({ name: 'storeid', type: 'uuid', nullable: true })
  storeId: string;

  @Column({ name: 'additionalstores', type: 'jsonb', nullable: true })
  additionalStores: string[];

  @Column({ name: 'ishybrid', default: false })
  isHybrid: boolean;

  @Column({ name: 'hybridstores', type: 'jsonb', nullable: true })
  hybridStores: string[];

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: Record<string, unknown>;

  @Column({ name: 'processassignments', type: 'jsonb', nullable: true })
  processAssignments: Record<string, unknown>;

  @Column({ name: 'lastlogin', type: 'timestamp', nullable: true })
  lastLogin: Date;

  /** True when name + store are filled (profile onboarding). Reporting manager is optional. */
  @Column({ name: 'profilesetupcomplete', default: false })
  profileSetupComplete: boolean;

  @Column({ name: 'profilesetupcompletedat', type: 'timestamp', nullable: true })
  profileSetupCompletedAt: Date;

  /** Access level: 'user' | 'admin' | 'super_admin'. Defaults to 'user'. */
  @Column({ name: 'role', default: 'user' })
  role: string;

  @CreateDateColumn({ name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
