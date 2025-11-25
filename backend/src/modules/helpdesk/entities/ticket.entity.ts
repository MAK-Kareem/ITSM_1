import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tickets', { schema: 'helpdesk' })
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'ticket_number' })
  ticketNumber: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column()
  priority: string; // Urgent, High, Medium, Low

  @Column()
  status: string; // Open, Assigned, In Progress, Pending, Resolved, Closed

  @Column()
  category: string;

  @Column({ name: 'request_type' })
  requestType: string; // Service Request, Issue, Question

  @Column({ name: 'requester_id' })
  requesterId: number;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @Column({ nullable: true, name: 'assigned_team' })
  assignedTeam: string;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'decimal', nullable: true })
  satisfaction: number;

  @Column({ type: 'jsonb', nullable: true })
  comments: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
