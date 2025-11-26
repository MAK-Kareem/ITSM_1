import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('incidents', { schema: 'incident_management' })
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'incident_number' })
  incidentNumber: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  priority: string; // Critical, High, Medium, Low

  @Column()
  severity: string; // 1, 2, 3, 4

  @Column()
  status: string; // New, In Progress, Resolved, Closed

  @Column()
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ name: 'reported_by' })
  reportedBy: number;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @Column({ nullable: true, name: 'assigned_group' })
  assignedGroup: string;

  @Column({ nullable: true })
  resolution: string;

  @Column({ nullable: true, name: 'root_cause' })
  rootCause: string;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'closed_at' })
  closedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  attachments: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
