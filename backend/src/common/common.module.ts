import { Module, Global } from '@nestjs/common';
import { FileUploadService } from './services/file-upload.service';
import { EmailService } from './services/email.service';

@Global()
@Module({
  providers: [FileUploadService, EmailService],
  exports: [FileUploadService, EmailService],
})
export class CommonModule {}
