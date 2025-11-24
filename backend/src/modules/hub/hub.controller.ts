import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HubService } from './hub.service';

@ApiTags('EazyPay Hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hub')
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Post('transactions')
  @ApiOperation({ summary: 'Create transaction' })
  createTransaction(@Body() createDto: any) {
    return this.hubService.createTransaction(createDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  findAllTransactions() {
    return this.hubService.findAllTransactions();
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findTransactionById(@Param('id') id: string) {
    return this.hubService.findTransactionById(+id);
  }

  @Post('merchants')
  @ApiOperation({ summary: 'Create merchant' })
  createMerchant(@Body() createDto: any) {
    return this.hubService.createMerchant(createDto);
  }

  @Get('merchants')
  @ApiOperation({ summary: 'Get all merchants' })
  findAllMerchants() {
    return this.hubService.findAllMerchants();
  }

  @Get('merchants/:id')
  @ApiOperation({ summary: 'Get merchant by ID' })
  findMerchantById(@Param('id') id: string) {
    return this.hubService.findMerchantById(+id);
  }

  @Patch('merchants/:id')
  @ApiOperation({ summary: 'Update merchant' })
  updateMerchant(@Param('id') id: string, @Body() updateDto: any) {
    return this.hubService.updateMerchant(+id, updateDto);
  }
}
