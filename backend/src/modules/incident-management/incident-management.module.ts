import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentManagementService } from './incident-management.service';
import { IncidentManagementController } from './incident-management.controller';
import { Incident } from './entities/incident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  controllers: [IncidentManagementController],
  providers: [IncidentManagementService],
  exports: [IncidentManagementService],
})
export class IncidentManagementModule {}
