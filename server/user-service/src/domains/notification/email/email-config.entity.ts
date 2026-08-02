import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_config_settings')
export class EmailConfigSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, default: 'default' })
  scopeKey: string;

  @Column({ nullable: true })
  smtpHost: string | null;

  @Column({ nullable: true })
  smtpPort: string | null;

  @Column({ nullable: true })
  smtpUser: string | null;

  @Column({ nullable: true })
  smtpPassword: string | null;

  @Column({ nullable: true })
  fromEmail: string | null;

  @Column({ nullable: true })
  fromName: string | null;

  @Column({ default: true })
  useTls: boolean;

  // Delivery provider: 'smtp' | 'graph'
  @Column({ nullable: true })
  deliveryProvider: string | null;

  // Microsoft Graph
  @Column({ nullable: true })
  azureTenantId: string | null;

  @Column({ nullable: true })
  azureClientId: string | null;

  @Column({ nullable: true })
  azureClientSecret: string | null;

  @Column({ nullable: true })
  graphSendAsUser: string | null;

  @Column({ nullable: true })
  frontendUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
