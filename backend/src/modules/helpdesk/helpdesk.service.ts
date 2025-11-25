import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class HelpdeskService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async create(ticketData: any): Promise<Ticket> {
    const ticketCount = await this.ticketRepository.count();
    const ticketNumber = `TKT${String(ticketCount + 1).padStart(6, '0')}`;

    const ticket = this.ticketRepository.create({
      ...ticketData,
      ticketNumber,
      status: ticketData.status || 'Open',
    });

    const savedTicket = await this.ticketRepository.save(ticket) as unknown as Ticket;
    return savedTicket;
  }

  async findAll(filters?: any): Promise<Ticket[]> {
    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket');

    if (filters?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }
    if (filters?.assignedTo) {
      queryBuilder.andWhere('ticket.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    return await queryBuilder.orderBy('ticket.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async update(id: number, updateData: any): Promise<Ticket> {
    if (updateData.status === 'Resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    await this.ticketRepository.update(id, updateData);
    return this.findOne(id);
  }

  async addComment(ticketId: number, comment: any): Promise<Ticket> {
    const ticket = await this.findOne(ticketId);

    const comments = ticket.comments || [];
    comments.push({
      ...comment,
      timestamp: new Date(),
    });

    await this.ticketRepository.update(ticketId, { comments });
    return this.findOne(ticketId);
  }

  async getStats() {
    const total = await this.ticketRepository.count();
    const open = await this.ticketRepository.count({ where: { status: 'Open' } });
    const inProgress = await this.ticketRepository.count({ where: { status: 'In Progress' } });
    const resolved = await this.ticketRepository.count({ where: { status: 'Resolved' } });

    return { total, open, inProgress, resolved };
  }
}
