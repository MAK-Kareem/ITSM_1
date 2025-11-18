import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('policies', { schema: 'policy_management' })
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'policy_number' })
  policyNumber: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, name: 'policy_type' })
  policyType: string;

  @Column({ default: '1.0' })
  version: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true, name: 'review_date' })
  reviewDate: Date;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ nullable: true })
  department: string;

  @Column({ default: true, name: 'approval_required' })
  approvalRequired: boolean;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ type: 'date', nullable: true, name: 'approval_date' })
  approvalDate: Date;

  @Column({ nullable: true, name: 'file_path' })
  filePath: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
