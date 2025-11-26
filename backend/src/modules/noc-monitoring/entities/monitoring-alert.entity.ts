import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('monitoring_alerts', { schema: 'noc_monitoring' })
export class MonitoringAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'alert_id' })
  alertId: string;

  @Column()
  severity: string;

  @Column({ name: 'alert_type' })
  alertType: string;

  @Column({ nullable: true })
  source: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ type: 'timestamp', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'resolution_notes' })
  resolutionNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
