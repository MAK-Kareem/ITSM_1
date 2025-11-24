import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Merchant } from './entities/merchant.entity';

@Injectable()
export class HubService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  // Transaction methods
  async createTransaction(createDto: any): Promise<PaymentTransaction> {
    const transaction = this.transactionRepository.create(createDto);
    const saved = await this.transactionRepository.save(transaction); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllTransactions(): Promise<PaymentTransaction[]> {
    return this.transactionRepository.find({
      order: { transactionDate: 'DESC' },
      take: 100,
    });
  }

  async findTransactionById(id: number): Promise<PaymentTransaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  // Merchant methods
  async createMerchant(createDto: any): Promise<Merchant> {
    const merchantId = await this.generateMerchantId();
    const merchant = this.merchantRepository.create({
      ...createDto,
      merchantId,
    });
    const saved = await this.merchantRepository.save(merchant); return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllMerchants(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findMerchantById(id: number): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
    return merchant;
  }

  async updateMerchant(id: number, updateDto: any): Promise<Merchant> {
    const merchant = await this.findMerchantById(id);
    Object.assign(merchant, updateDto);
    const saved = await this.merchantRepository.save(merchant); return Array.isArray(saved) ? saved[0] : saved;
  }

  private async generateMerchantId(): Promise<string> {
    const count = await this.merchantRepository.count();
    const sequence = String(count + 1).padStart(6, '0');
    return `MER${sequence}`;
  }
}
