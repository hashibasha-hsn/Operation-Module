import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('conversation_members')
@Unique('uq_conversation_member', ['conversationId', 'userId'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', length: 255 })
  conversationId: string;

  @Column({ name: 'user_id', length: 255 })
  userId: string;

  /** 'owner' for the channel creator, 'admin' or 'member' otherwise */
  @Column({ name: 'role', length: 20, default: 'member' })
  role: 'owner' | 'admin' | 'member';

  /** 'member' = active/joined, 'invited' = pending invite, 'declined' = rejected invite */
  @Column({ name: 'status', length: 20, default: 'member' })
  status: 'member' | 'invited' | 'declined';

  /** Drives unread count: messages after this time (not sent by me) are unread */
  @Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
  lastReadAt?: Date | null;

  /** 'all' | 'mentions' | 'none' */
  @Column({ name: 'notification_preference', length: 20, default: 'all' })
  notificationPreference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
