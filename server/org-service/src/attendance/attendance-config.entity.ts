import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('attendance_config')
export class AttendanceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'default-org' })
  organizationId: string;

  @Column({ default: true })
  status: boolean;

  @Column({ default: true })
  geolocation: boolean;

  @Column({ default: false })
  checkInImage: boolean;

  @Column({ default: false })
  checkOutImage: boolean;

  @Column({ default: '09:00' })
  operatingHoursStart: string;

  @Column({ default: '18:00' })
  operatingHoursEnd: string;

  @Column({ type: 'int', default: 9 })
  dailyWorkingHours: number;

  @Column({ default: true })
  calculateOvertime: boolean;

  @Column({ default: true })
  designation: boolean;

  @Column({ default: true })
  users: boolean;

  @Column({ default: true })
  usersOutsideEntity: boolean;

  @Column({ default: false })
  removeInactiveUsers: boolean;

  @Column({ default: false })
  primaryAssignee: boolean;

  @Column({ default: false })
  notify: boolean;

  @Column({ default: true })
  autoCheckInOnLogin: boolean;

  @Column({ default: true })
  autoCheckOutOnLogout: boolean;

  @Column({ type: 'json', nullable: true })
  assignedStoreIds: string[];

  @Column({ type: 'json', nullable: true })
  assignedUserIds: string[];

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
