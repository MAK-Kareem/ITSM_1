import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('merchants', { schema: 'hub' })
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'merchant_name' })
  merchantName: string;

  @Column({ nullable: true, name: 'business_name' })
  businessName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, name: 'contact_person' })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'date', nullable: true, name: 'onboarding_date' })
  onboardingDate: Date;

  @Column({ nullable: true, name: 'settlement_account' })
  settlementAccount: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'commission_rate' })
  commissionRate: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
