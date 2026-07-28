import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  store: string;

  @Column({ nullable: true })
  storeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  checkInTime: string;

  @Column({ nullable: true })
  checkOutTime: string;

  @Column({ nullable: true })
  totalHours: string;

  @Column({ type: 'float', nullable: true })
  expectedHours: number;

  @Column({ type: 'float', nullable: true })
  deviation: number;

  @Column({ nullable: true })
  selfieUrl: string;

  @Column({ nullable: true })
  punchOutImage: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ default: 'checked-in' })
  status: string;

  @Column({ default: 'default-org' })
  organizationId: string;

  @Column({ default: 'manual' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
