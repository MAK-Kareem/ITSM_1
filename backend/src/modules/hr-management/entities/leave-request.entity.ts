import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('leave_requests', { schema: 'hr_management' })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'request_number' })
  requestNumber: string;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'leave_type' })
  leaveType: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ name: 'total_days' })
  totalDays: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ type: 'timestamp', nullable: true, name: 'approval_date' })
  approvalDate: Date;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
