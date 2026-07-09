import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseCategory } from './course-category.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => CourseCategory)
  @JoinColumn({ name: 'category_id' })
  category: CourseCategory;

  @Column({ type: 'json', nullable: true })
  content: any; // Course content (videos, documents, etc.)

  @Column({ type: 'json', nullable: true })
  quizId: string;

  @Column({ default: 'draft' })
  status: string; // 'draft', 'published', 'archived'

  @Column({ type: 'json', nullable: true })
  assigneeProfiles: any; // Store, designation, etc.

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
