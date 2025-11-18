import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitoringAlert } from './entities/monitoring-alert.entity';
import { SystemHealth } from './entities/system-health.entity';

@Injectable()
export class NocMonitoringService {
  constructor(
    @InjectRepository(MonitoringAlert)
    private alertRepository: Repository<MonitoringAlert>,
    @InjectRepository(SystemHealth)
    private healthRepository: Repository<SystemHealth>,
  ) {}

  // Alert methods
  async createAlert(createDto: any): Promise<MonitoringAlert> {
    const alertId = await this.generateAlertId();
    const alert = this.alertRepository.create({
      ...createDto,
      alertId,
    });
    const saved = await this.alertRepository.save(alert); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllAlerts(): Promise<MonitoringAlert[]> {
    return this.alertRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAlertById(id: number): Promise<MonitoringAlert> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  async acknowledgeAlert(id: number, userId: number): Promise<MonitoringAlert> {
    const alert = await this.findAlertById(id);
    alert.assignedTo = userId;
    alert.acknowledgedAt = new Date();
    alert.status = 'acknowledged';
    const saved = await this.alertRepository.save(alert); return Array.isArray(saved) ? saved[0] : saved;
  }

  async resolveAlert(id: number, resolutionNotes: string): Promise<MonitoringAlert> {
    const alert = await this.findAlertById(id);
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes;
    alert.status = 'resolved';
    const saved = await this.alertRepository.save(alert); return Array.isArray(saved) ? saved[0] : saved;
  }

  // System Health methods
  async createHealthRecord(createDto: any): Promise<SystemHealth> {
    const health = this.healthRepository.create(createDto);
    const saved = await this.healthRepository.save(health); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllHealthRecords(): Promise<SystemHealth[]> {
    return this.healthRepository.find({
      order: { lastCheck: 'DESC' },
      take: 50,
    });
  }

  async findHealthBySystem(systemName: string): Promise<SystemHealth[]> {
    return this.healthRepository.find({
      where: { systemName },
      order: { lastCheck: 'DESC' },
      take: 10,
    });
  }

  private async generateAlertId(): Promise<string> {
    const timestamp = Date.now();
    const count = await this.alertRepository.count();
    return `ALERT-${timestamp}-${count + 1}`;
  }
}
