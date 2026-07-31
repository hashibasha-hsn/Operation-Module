import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_certificates')
export class CourseCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column()
  userId: string;

  @Column()
  progressId: string;

  @Column()
  organizationId: string;

  @Column({ default: 0 })
  score: number;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @CreateDateColumn()
  createdAt: Date;
}
