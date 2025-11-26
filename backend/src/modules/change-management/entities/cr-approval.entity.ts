
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChangeRequest } from './change-request.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('cr_approvals', { schema: 'change_management' })
export class CRApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.approvals)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column()
  stage: number;

  @Column({ name: 'approver_id' })
  approverId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'approver_role' })
  approverRole: string;

  @Column()
  status: string;

  @Column({ type: 'text', nullable: true, name: 'signature_file_path' })
  signatureFilePath: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ nullable: true, name: 'risk_accepted' })
  riskAccepted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
