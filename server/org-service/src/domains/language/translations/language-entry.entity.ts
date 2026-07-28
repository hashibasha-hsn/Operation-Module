import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('language_entries')
export class LanguageEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  key: string;

  @Column({ type: 'text' })
  en: string;

  @Column({ type: 'text' })
  ar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
