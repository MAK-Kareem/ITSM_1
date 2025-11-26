import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('documents', { schema: 'document_management' })
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'document_number' })
  documentNumber: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, name: 'document_type' })
  documentType: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ nullable: true, name: 'file_size' })
  fileSize: number;

  @Column({ default: '1.0' })
  version: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true, name: 'access_level' })
  accessLevel: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
