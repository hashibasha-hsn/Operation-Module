import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('scope_access')
@Index(['userId', 'orgId', 'scopeType'])
export class ScopeAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  orgId: string;

  @Column()
  scopeType: string; // REGION, LOCATION, PROCESS, TASK

  @Column()
  scopeId: string; // ID of the region/location/process/task

  @Column({ type: 'jsonb', nullable: true })
  permissions: any; // Specific permissions for this scope

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
