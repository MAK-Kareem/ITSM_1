import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentManagementService } from './document-management.service';
import { DocumentManagementController } from './document-management.controller';
import { Document } from './entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document])],
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
