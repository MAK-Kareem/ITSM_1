
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

@Entity('cr_history', { schema: 'change_management' })
export class CRHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.history)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column({ name: 'changed_by' })
  changedBy: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'changed_by' })
  user: User;

  @Column()
  action: string;

  @Column({ nullable: true, name: 'from_stage' })
  fromStage: number;

  @Column({ nullable: true, name: 'to_stage' })
  toStage: number;

  @Column({ nullable: true, name: 'from_status' })
  fromStatus: string;

  @Column({ nullable: true, name: 'to_status' })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true, name: 'additional_data' })
  additionalData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
