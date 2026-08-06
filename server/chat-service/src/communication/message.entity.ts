import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index('idx_message_conversation', ['conversationId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', length: 255 })
  conversationId: string;

  @Column({ name: 'sender_id', length: 255 })
  senderId: string;

  @Column({ name: 'body', type: 'text', default: '' })
  body: string;

  /** { url, fileName, mimeType, size } */
  @Column({ name: 'attachment', type: 'jsonb', nullable: true })
  attachment?: { url: string; fileName: string; mimeType: string; size: number } | null;

  /** Id of the message this message replies to (WhatsApp-style reply) */
  @Column({ name: 'parent_id', length: 255, nullable: true })
  parentId?: string | null;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
