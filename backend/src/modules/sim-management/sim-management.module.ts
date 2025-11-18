import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimManagementService } from './sim-management.service';
import { SimManagementController } from './sim-management.controller';
import { SimCard } from './entities/sim-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SimCard])],
  controllers: [SimManagementController],
  providers: [SimManagementService],
  exports: [SimManagementService],
})
export class SimManagementModule {}
