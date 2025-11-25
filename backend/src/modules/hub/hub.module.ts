import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubService } from './hub.service';
import { HubController } from './hub.controller';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Merchant } from './entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, Merchant])],
  controllers: [HubController],
  providers: [HubService],
  exports: [HubService],
})
export class HubModule {}
