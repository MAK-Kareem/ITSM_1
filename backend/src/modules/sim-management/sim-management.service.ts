import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimCard } from './entities/sim-card.entity';

@Injectable()
export class SimManagementService {
  constructor(
    @InjectRepository(SimCard)
    private simRepository: Repository<SimCard>,
  ) {}

  async create(createDto: any): Promise<SimCard> {
    const simNumber = await this.generateSimNumber();
    const sim = this.simRepository.create({
      ...createDto,
      simNumber,
    });
    const saved = await this.simRepository.save(sim); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(): Promise<SimCard[]> {
    return this.simRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SimCard> {
    const sim = await this.simRepository.findOne({ where: { id } });
    if (!sim) {
      throw new NotFoundException(`SIM card with ID ${id} not found`);
    }
    return sim;
  }

  async update(id: number, updateDto: any): Promise<SimCard> {
    const sim = await this.findOne(id);
    Object.assign(sim, updateDto);
    const saved = await this.simRepository.save(sim); return Array.isArray(saved) ? saved[0] : saved;
  }

  async remove(id: number): Promise<void> {
    const sim = await this.findOne(id);
    await this.simRepository.remove(sim);
  }

  async assignToUser(id: number, userId: number, device: string): Promise<SimCard> {
    const sim = await this.findOne(id);
    
    if (sim.status !== 'available') {
      throw new BadRequestException('SIM card is not available for assignment');
    }

    sim.assignedTo = userId;
    sim.assignedDevice = device;
    sim.status = 'assigned';
    sim.activationDate = new Date();

    const saved = await this.simRepository.save(sim); return Array.isArray(saved) ? saved[0] : saved;
  }

  async unassignFromUser(id: number): Promise<SimCard> {
    const sim = await this.findOne(id);
    
    sim.assignedTo = null;
    sim.assignedDevice = null;
    sim.status = 'available';

    const saved = await this.simRepository.save(sim); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAvailableSims(): Promise<SimCard[]> {
    return this.simRepository.find({
      where: { status: 'available' },
      order: { simNumber: 'ASC' },
    });
  }

  async findByOperator(operator: string): Promise<SimCard[]> {
    return this.simRepository.find({
      where: { operator },
      order: { simNumber: 'ASC' },
    });
  }

  private async generateSimNumber(): Promise<string> {
    const count = await this.simRepository.count();
    const sequence = String(count + 1).padStart(6, '0');
    return `SIM${sequence}`;
  }
}
