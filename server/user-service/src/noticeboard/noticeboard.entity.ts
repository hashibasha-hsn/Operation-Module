import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserProfile } from '../profiles/user-profile.entity';

@Entity('noticeboard_posts')
export class NoticeboardPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  mediaUrl: string;

  @Column({ nullable: true, length: 50 })
  mediaType: string; // 'image', 'video'

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: false })
  enableDiscussions: boolean;

  @Column()
  createdBy: string;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: 'createdBy' })
  creator: UserProfile;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
