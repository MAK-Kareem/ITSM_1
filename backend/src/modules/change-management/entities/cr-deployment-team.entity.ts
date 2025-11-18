
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChangeRequest } from './change-request.entity';

@Entity('cr_deployment_team', { schema: 'change_management' })
export class CRDeploymentTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.deploymentTeam)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column({ name: 'member_name' })
  memberName: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ default: 'member' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

