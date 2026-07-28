import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('process_tags')
export class ProcessTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  tagName: string;

  @Column({ length: 100 })
  ownerName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

}
