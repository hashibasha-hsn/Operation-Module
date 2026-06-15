import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('designations')
export class Designation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  reportingDesignationId: string;

  @Column()
  organizationId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  hasCreatorAccess: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Designation, { nullable: true })
  @JoinColumn({ name: 'reportingDesignationId' })
  reportingDesignation: Designation;

  @OneToMany(() => Designation, designation => designation.reportingDesignation)
  subordinates: Designation[];
}
