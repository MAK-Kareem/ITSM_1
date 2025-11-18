import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('system_health', { schema: 'noc_monitoring' })
export class SystemHealth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'system_name' })
  systemName: string;

  @Column({ nullable: true })
  component: string;

  @Column({ default: 'healthy' })
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'cpu_usage' })
  cpuUsage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'memory_usage' })
  memoryUsage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'disk_usage' })
  diskUsage: number;

  @Column({ type: 'bigint', nullable: true, name: 'uptime_seconds' })
  uptimeSeconds: number;

  @Column({ type: 'timestamp', name: 'last_check', default: () => 'CURRENT_TIMESTAMP' })
  lastCheck: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
