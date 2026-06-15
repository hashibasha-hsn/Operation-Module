import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('course_quizzes')
export class CourseQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  quizTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  questions: any[]; // Array of questions

  @Column({ default: 0 })
  passingScore: number; // Minimum score to pass

  @Column({ default: 0 })
  duration: number; // Duration in minutes

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
