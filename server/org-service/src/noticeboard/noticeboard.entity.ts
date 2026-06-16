import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('noticeboard_posts')
export class NoticeboardPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', length: 255 })
  organizationId: string;

  @Column({ length: 500 })
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'file_url', length: 1000, nullable: true })
  fileUrl: string;

  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_type', length: 50, nullable: true })
  fileType: string;

  @Column({ name: 'admin_only_comments', default: false })
  adminOnlyComments: boolean;

  @Column({ name: 'tag_names', type: 'jsonb', default: '[]' })
  tagNames: string[];

  @Column({ name: 'created_by', length: 255, nullable: true })
  createdBy: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'completed_count', default: 0 })
  completedCount: number;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
