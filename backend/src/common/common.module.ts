import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from './services/file-upload.service';
import { EmailService } from './services/email.service';
import { User } from '../modules/auth/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [FileUploadService, EmailService],
  exports: [FileUploadService, EmailService],
})
export class CommonModule {}