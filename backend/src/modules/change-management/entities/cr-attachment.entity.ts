
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

@Entity('cr_attachments', { schema: 'change_management' })
export class CRAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cr_id' })
  crId: number;

  @ManyToOne(() => ChangeRequest, (cr) => cr.attachments)
  @JoinColumn({ name: 'cr_id' })
  changeRequest: ChangeRequest;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ nullable: true, name: 'file_size' })
  fileSize: number;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
