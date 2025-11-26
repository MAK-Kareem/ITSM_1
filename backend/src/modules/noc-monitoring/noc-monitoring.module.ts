import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NocMonitoringService } from './noc-monitoring.service';
import { NocMonitoringController } from './noc-monitoring.controller';
import { MonitoringAlert } from './entities/monitoring-alert.entity';
import { SystemHealth } from './entities/system-health.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MonitoringAlert, SystemHealth])],
  controllers: [NocMonitoringController],
  providers: [NocMonitoringService],
  exports: [NocMonitoringService],
})
export class NocMonitoringModule {}
