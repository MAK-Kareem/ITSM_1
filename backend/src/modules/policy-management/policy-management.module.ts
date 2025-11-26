import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyManagementService } from './policy-management.service';
import { PolicyManagementController } from './policy-management.controller';
import { Policy } from './entities/policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  controllers: [PolicyManagementController],
  providers: [PolicyManagementService],
  exports: [PolicyManagementService],
})
export class PolicyManagementModule {}
