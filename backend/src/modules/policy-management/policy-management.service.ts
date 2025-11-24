import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';

@Injectable()
export class PolicyManagementService {
  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
  ) {}

  async create(createDto: any, userId: number): Promise<Policy> {
    const policyNumber = await this.generatePolicyNumber();
    
    const policy = this.policyRepository.create({
      ...createDto,
      policyNumber,
      ownerId: userId,
    });

    const saved = await this.policyRepository.save(policy); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(): Promise<Policy[]> {
    return this.policyRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Policy> {
    const policy = await this.policyRepository.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }
    return policy;
  }

  async update(id: number, updateDto: any): Promise<Policy> {
    const policy = await this.findOne(id);
    Object.assign(policy, updateDto);
    const saved = await this.policyRepository.save(policy); return Array.isArray(saved) ? saved[0] : saved;
  }

  async remove(id: number): Promise<void> {
    const policy = await this.findOne(id);
    await this.policyRepository.remove(policy);
  }

  async approve(id: number, approverId: number): Promise<Policy> {
    const policy = await this.findOne(id);

    if (policy.status !== 'draft') {
      throw new BadRequestException('Only draft policies can be approved');
    }

    policy.status = 'active';
    policy.approvedBy = approverId;
    policy.approvalDate = new Date();

    const saved = await this.policyRepository.save(policy); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findByCategory(category: string): Promise<Policy[]> {
    return this.policyRepository.find({
      where: { category, status: 'active' },
      order: { title: 'ASC' },
    });
  }

  async findActivePolicies(): Promise<Policy[]> {
    return this.policyRepository.find({
      where: { status: 'active' },
      order: { title: 'ASC' },
    });
  }

  private async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.policyRepository.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `POL-${year}-${sequence}`;
  }
}
