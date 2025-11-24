import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer'; 
import { ChangeManagementService } from './change-management.service';
import { ChangeManagementController } from './change-management.controller';
import { ChangeRequest } from './entities/change-request.entity';
import { CRApproval } from './entities/cr-approval.entity';
import { CRTestingResult } from './entities/cr-testing-result.entity';
import { CRQAChecklist } from './entities/cr-qa-checklist.entity';
import { CRDeploymentTeam } from './entities/cr-deployment-team.entity';
import { CRAttachment } from './entities/cr-attachment.entity';
import { CRHistory } from './entities/cr-history.entity';
import { FileUploadService } from '../../common/services/file-upload.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChangeRequest,
      CRApproval,
      CRTestingResult,
      CRQAChecklist,
      CRDeploymentTeam,
      CRAttachment,
      CRHistory,
    ]),
    MulterModule.register({
      storage: memoryStorage(),
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  ],
  controllers: [ChangeManagementController],
  providers: [ChangeManagementService, FileUploadService, EmailService],
  exports: [ChangeManagementService],
})
export class ChangeManagementModule {}
