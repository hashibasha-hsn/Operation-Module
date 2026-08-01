import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_progress')
export class CourseProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseId: string;

  @Column()
  userId: string;

  @Column({ default: 0 })
  progress: number; // Progress percentage (0-100)

  @Column({ default: 'not_started' })
  status: string; // 'not_started', 'in_progress', 'completed'

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'json', nullable: true })
  quizScore: any; // Quiz score if completed

  @Column()
  organizationId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderAt: Date;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
