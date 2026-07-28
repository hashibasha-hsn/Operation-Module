import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';

@Entity('noticeboard_comments')
export class NoticeboardComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => NoticeboardPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: NoticeboardPost;

  @Column({ name: 'user_id', length: 255 })
  userId: string;

  @Column({ name: 'user_name', length: 255, nullable: true })
  userName: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ name: 'is_admin_comment', default: false })
  isAdminComment: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
