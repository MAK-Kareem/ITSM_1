
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

@Entity('cr_testing_results', { schema: 'change_management' })
export class CRTestingResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.testingResults)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column({ name: 'test_type' })
  testType: string;

  @Column({ name: 'tested_by' })
  testedBy: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'tested_by' })
  tester: User;

  @Column({ type: 'timestamp', name: 'test_date', default: () => 'CURRENT_TIMESTAMP' })
  testDate: Date;

  @Column({ type: 'jsonb', name: 'test_results' })
  testResults: Array<{
    testCase: string;
    expectedResult: string;
    actualResult: string;
    passed: boolean;
    remarks?: string;
  }>;

  @Column({ nullable: true })
  passed: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
