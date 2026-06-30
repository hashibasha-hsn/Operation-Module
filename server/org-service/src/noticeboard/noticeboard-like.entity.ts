import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';

@Entity('noticeboard_likes')
@Unique(['postId', 'userId'])
export class NoticeboardLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => NoticeboardPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: NoticeboardPost;

  @Column({ name: 'user_id', length: 255 })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
