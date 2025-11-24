import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NocMonitoringService } from './noc-monitoring.service';

@ApiTags('NOC Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('noc-monitoring')
export class NocMonitoringController {
  constructor(private readonly nocService: NocMonitoringService) {}

  @Post('alerts')
  @ApiOperation({ summary: 'Create monitoring alert' })
  createAlert(@Body() createDto: any) {
    return this.nocService.createAlert(createDto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all alerts' })
  findAllAlerts() {
    return this.nocService.findAllAlerts();
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get alert by ID' })
  findAlertById(@Param('id') id: string) {
    return this.nocService.findAlertById(+id);
  }

  @Patch('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  acknowledgeAlert(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.nocService.acknowledgeAlert(+id, body.userId);
  }

  @Patch('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  resolveAlert(@Param('id') id: string, @Body() body: { resolutionNotes: string }) {
    return this.nocService.resolveAlert(+id, body.resolutionNotes);
  }

  @Post('health')
  @ApiOperation({ summary: 'Create health record' })
  createHealthRecord(@Body() createDto: any) {
    return this.nocService.createHealthRecord(createDto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get all health records' })
  findAllHealthRecords() {
    return this.nocService.findAllHealthRecords();
  }

  @Get('health/:systemName')
  @ApiOperation({ summary: 'Get health by system name' })
  findHealthBySystem(@Param('systemName') systemName: string) {
    return this.nocService.findHealthBySystem(systemName);
  }
}
