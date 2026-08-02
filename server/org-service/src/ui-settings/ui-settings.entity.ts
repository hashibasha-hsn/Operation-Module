import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ui_settings')
export class UiSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  organizationId: string;

  @Column({ type: 'jsonb', default: {} })
  theme: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
