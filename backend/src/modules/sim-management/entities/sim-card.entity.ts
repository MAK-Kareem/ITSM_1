import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('sim_cards', { schema: 'sim_management' })
export class SimCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'sim_number' })
  simNumber: string;

  @Column({ unique: true })
  iccid: string;

  @Column({ unique: true, nullable: true, name: 'mobile_number' })
  mobileNumber: string;

  @Column({ nullable: true })
  operator: string;

  @Column({ nullable: true, name: 'sim_type' })
  simType: string;

  @Column({ default: 'available' })
  status: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ nullable: true, name: 'assigned_device' })
  assignedDevice: string;

  @Column({ type: 'date', nullable: true, name: 'activation_date' })
  activationDate: Date;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_cost' })
  monthlyCost: number;

  @Column({ nullable: true, name: 'data_plan' })
  dataPlan: string;

  @Column({ nullable: true, name: 'voice_plan' })
  voicePlan: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
