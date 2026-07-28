import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';

@Entity('noticeboard_reads')
@Unique(['postId', 'userId'])
export class NoticeboardRead {
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
  userName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
