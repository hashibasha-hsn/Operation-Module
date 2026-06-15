import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

// Taqtics-style role hierarchy
export enum RoleName {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  AREA_MANAGER = 'AREA_MANAGER',
  PROCESS_MANAGER = 'PROCESS_MANAGER',
  USER_MANAGER = 'USER_MANAGER',
  STORE_MANAGER = 'STORE_MANAGER',
  STORE_EMPLOYEE = 'STORE_EMPLOYEE'
}

export enum ScopeLevel {
  ORG_WIDE = 'ORG_WIDE',
  REGIONAL = 'REGIONAL',
  PROCESS_SPECIFIC = 'PROCESS_SPECIFIC',
  USER_OVERSIGHT = 'USER_OVERSIGHT',
  STORE_LEVEL = 'STORE_LEVEL',
  TASK_LEVEL = 'TASK_LEVEL'
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    unique: true
  })
  name: RoleName;

  @Column()
  displayName: string;

  @Column()
  hierarchyLevel: number; // 1 = highest (Company Admin), 6 = lowest (Store Employee)

  @Column({
    type: 'enum',
    enum: ScopeLevel
  })
  scopeLevel: ScopeLevel;

  @Column({ default: false })
  isCreator: boolean; // Can create workflows/processes

  @Column({ nullable: true })
  parentRoleId: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'parentRoleId' })
  parentRole: Role;

  @OneToMany(() => Role, role => role.parentRole)
  childRoles: Role[];
}
