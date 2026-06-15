import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({
    type: 'enum',
    enum: ['HIGH', 'NORMAL', 'LOW'],
    default: 'NORMAL'
  })
  priority: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
    default: 'PENDING'
  })
  status: string;

  @Column({ nullable: true })
  deliveryMethod: string; // EMAIL, SMS, PUSH, IN_APP

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}
