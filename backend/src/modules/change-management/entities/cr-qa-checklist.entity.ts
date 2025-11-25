
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

@Entity('cr_qa_checklists', { schema: 'change_management' })
export class CRQAChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.qaChecklists)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column({ name: 'qa_officer_id' })
  qaOfficerId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'qa_officer_id' })
  qaOfficer: User;

  @Column({ type: 'jsonb', name: 'checklist_data' })
  checklistData: Array<{
    checkItem: string;
    checked: boolean;
    remarks?: string;
  }>;

  @Column({ default: false })
  validated: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'validation_date' })
  validationDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
