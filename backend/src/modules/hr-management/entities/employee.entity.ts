import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('employees', { schema: 'hr_management' })
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true, name: 'employment_type' })
  employmentType: string;

  @Column({ default: 'active', name: 'employment_status' })
  employmentStatus: string;

  @Column({ type: 'date', nullable: true, name: 'hire_date' })
  hireDate: Date;

  @Column({ type: 'date', nullable: true, name: 'termination_date' })
  terminationDate: Date;

  @Column({ nullable: true, name: 'manager_id' })
  managerId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary: number;

  @Column({ default: 0, name: 'annual_leave_balance' })
  annualLeaveBalance: number;

  @Column({ default: 0, name: 'sick_leave_balance' })
  sickLeaveBalance: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
