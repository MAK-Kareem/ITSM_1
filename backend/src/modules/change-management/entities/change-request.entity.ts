import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CRApproval } from './cr-approval.entity';
import { CRTestingResult } from './cr-testing-result.entity';
import { CRQAChecklist } from './cr-qa-checklist.entity';
import { CRDeploymentTeam } from './cr-deployment-team.entity';
import { CRAttachment } from './cr-attachment.entity';
import { CRHistory } from './cr-history.entity';

@Entity('change_requests', { schema: 'change_management' })
export class ChangeRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'cr_number' })
  crNumber: string;

  // Stage 1: Requestor Section
  @Column({ name: 'requested_by' })
  requestedBy: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requested_by' })
  requester: User;

  @Column({ type: 'timestamp', name: 'request_date', default: () => 'CURRENT_TIMESTAMP' })
  requestDate: Date;

  @Column({ type: 'text', name: 'purpose_of_change' })
  purposeOfChange: string;

  @Column({ type: 'text', name: 'description_of_change' })
  descriptionOfChange: string;

  @Column({ name: 'line_manager_id' })
  lineManagerId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'line_manager_id' })
  lineManager: User;

  @Column({ name: 'business_priority' })
  businessPriority: string;

  @Column({ type: 'text', nullable: true, name: 'priority_justification' })
  priorityJustification: string;

  @Column({ type: 'text', nullable: true, name: 'requestor_signature' })
  requestorSignature: string;

  // Workflow State
  @Column({ name: 'current_stage', default: 1 })
  currentStage: number;

  @Column({ name: 'current_status', default: 'Pending LM Approval' })
  currentStatus: string;

  // Stage 3: IT Officer Assignment
  @Column({ nullable: true, name: 'assigned_to_it_officer_id' })
  assignedToITOfficerId: number;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assigned_to_it_officer_id' })
  assignedITOfficer: User;

  // Stage 4: IT Officer Assessment Fields
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true, name: 'impacts_client_service' })
  impactsClientService: boolean;

  @Column({ type: 'text', nullable: true, name: 'impact_assessment' })
  impactAssessment: string;

  @Column({ type: 'text', nullable: true, name: 'backout_rollback_plan' })
  backoutRollbackPlan: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'expected_downtime_value' })
  expectedDowntimeValue: number;

  @Column({ nullable: true, name: 'expected_downtime_unit' })
  expectedDowntimeUnit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'cost_involved' })
  costInvolved: number;

  @Column({ type: 'timestamp', nullable: true, name: 'planned_datetime' })
  plannedDatetime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_backup_date' })
  lastBackupDate: Date;

  @Column({ type: 'text', nullable: true, name: 'ito_signature' })
  itoSignature: string;

  // Stage 10: NOC Closure Fields
  @Column({ type: 'text', nullable: true, name: 'noc_closure_notes' })
  nocClosureNotes: string;

  @Column({ nullable: true, name: 'incident_triggered' })
  incidentTriggered: boolean;

  @Column({ type: 'text', nullable: true, name: 'incident_details' })
  incidentDetails: string;

  @Column({ nullable: true, name: 'rollback_triggered' })
  rollbackTriggered: boolean;

  @Column({ type: 'text', nullable: true, name: 'rollback_details' })
  rollbackDetails: string;

  @Column({ type: 'text', nullable: true, name: 'noc_closure_justification' })
  nocClosureJustification: string;

  @Column({ type: 'text', nullable: true, name: 'noc_signature' })
  nocSignature: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deployment_completed_at' })
  deploymentCompletedAt: Date;

  // Relations
  @OneToMany(() => CRApproval, (approval) => approval.changeRequest)
  approvals: CRApproval[];

  @OneToMany(() => CRTestingResult, (testing) => testing.changeRequest)
  testingResults: CRTestingResult[];

  @OneToMany(() => CRQAChecklist, (checklist) => checklist.changeRequest)
  qaChecklists: CRQAChecklist[];

  @OneToMany(() => CRDeploymentTeam, (team) => team.changeRequest)
  deploymentTeam: CRDeploymentTeam[];

  @OneToMany(() => CRAttachment, (attachment) => attachment.changeRequest)
  attachments: CRAttachment[];

  @OneToMany(() => CRHistory, (history) => history.changeRequest)
  history: CRHistory[];
}
