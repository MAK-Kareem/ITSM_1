import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrManagementService } from './hr-management.service';
import { HrManagementController } from './hr-management.controller';
import { Employee } from './entities/employee.entity';
import { LeaveRequest } from './entities/leave-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, LeaveRequest])],
  controllers: [HrManagementController],
  providers: [HrManagementService],
  exports: [HrManagementService],
})
export class HrManagementModule {}
