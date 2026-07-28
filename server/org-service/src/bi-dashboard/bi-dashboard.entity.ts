import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('bi_dashboards')
export class BIDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 50 })
  type: 'process-workflow' | 'ticket' | 'action-point';

  @Column({ type: 'json', nullable: true })
  config: any; // Dashboard configuration

  @Column({ default: false })
  includeActionPoints: boolean; // For process-workflow dashboards

  @Column({ type: 'json', nullable: true })
  ticketType: 'normal' | 'asset' | null; // For ticket dashboards

  @Column({ type: 'simple-array', default: [] })
  processIds: string[]; // Selected processes for process-workflow dashboards

  @Column({ type: 'simple-array', default: [] })
  ownerIds: string[];

  @Column({ type: 'simple-array', default: [] })
  assigneeIds: string[];

  @Column({ type: 'simple-array', default: [] })
  readOnlyAssigneeIds: string[];

  @Column({ default: 0 })
  chartsCount: number;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @OneToMany(() => BIChart, (chart) => chart.dashboard, { cascade: true })
  charts: BIChart[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bi_charts')
export class BIChart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 50 })
  chartType: 'bar' | 'group' | 'stack' | 'line' | 'pie' | 'heatmap' | 'table' | 'advanced-table' | 'kpi' | 'label';

  @Column({ type: 'json', nullable: true })
  config: any; // Chart configuration (dimensions, filters, colors, etc.)

  @Column({ type: 'json', nullable: true })
  data: any; // Chart data

  @Column({ type: 'integer', default: 0 })
  positionX: number;

  @Column({ type: 'integer', default: 0 })
  positionY: number;

  @Column({ type: 'integer', default: 1 })
  width: number;

  @Column({ type: 'integer', default: 1 })
  height: number;

  @ManyToOne(() => BIDashboard, (dashboard) => dashboard.charts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: BIDashboard;

  @Column()
  dashboardId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;
}
