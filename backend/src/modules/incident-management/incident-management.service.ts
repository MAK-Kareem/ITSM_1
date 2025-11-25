import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';

@Injectable()
export class IncidentManagementService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  async create(incidentData: any): Promise<Incident> {
    const incidentCount = await this.incidentRepository.count();
    const incidentNumber = `INC${String(incidentCount + 1).padStart(6, '0')}`;

    const incident = this.incidentRepository.create({
      ...incidentData,
      incidentNumber,
      status: incidentData.status || 'New',
    });

    const savedIncident = await this.incidentRepository.save(incident) as unknown as Incident;
    return savedIncident;
  }

  async findAll(filters?: any): Promise<Incident[]> {
    const queryBuilder = this.incidentRepository.createQueryBuilder('incident');

    if (filters?.status) {
      queryBuilder.andWhere('incident.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      queryBuilder.andWhere('incident.priority = :priority', { priority: filters.priority });
    }
    if (filters?.assignedTo) {
      queryBuilder.andWhere('incident.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    return await queryBuilder.orderBy('incident.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return incident;
  }

  async update(id: number, updateData: any): Promise<Incident> {
    if (updateData.status === 'Resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (updateData.status === 'Closed' && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }

    await this.incidentRepository.update(id, updateData);
    return this.findOne(id);
  }

  async getMetrics() {
    const total = await this.incidentRepository.count();
    const open = await this.incidentRepository.count({ where: { status: 'New' } });
    const inProgress = await this.incidentRepository.count({ where: { status: 'In Progress' } });
    const resolved = await this.incidentRepository.count({ where: { status: 'Resolved' } });
    const closed = await this.incidentRepository.count({ where: { status: 'Closed' } });

    return { total, open, inProgress, resolved, closed };
  }
}
