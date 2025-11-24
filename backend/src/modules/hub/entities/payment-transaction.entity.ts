import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('payment_transactions', { schema: 'hub' })
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ nullable: true, name: 'merchant_id' })
  merchantId: string;

  @Column({ nullable: true, name: 'terminal_id' })
  terminalId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'BHD' })
  currency: string;

  @Column({ nullable: true, name: 'transaction_type' })
  transactionType: string;

  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true, name: 'card_type' })
  cardType: string;

  @Column({ nullable: true, name: 'card_last_four' })
  cardLastFour: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true, name: 'authorization_code' })
  authorizationCode: string;

  @Column({ nullable: true, name: 'response_code' })
  responseCode: string;

  @Column({ type: 'text', nullable: true, name: 'response_message' })
  responseMessage: string;

  @Column({ type: 'timestamp', name: 'transaction_date', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ type: 'date', nullable: true, name: 'settlement_date' })
  settlementDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
