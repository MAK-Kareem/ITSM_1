import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SimManagementService } from './sim-management.service';

@ApiTags('SIM Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sim-cards')
export class SimManagementController {
  constructor(private readonly simService: SimManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create SIM card' })
  create(@Body() createDto: any) {
    return this.simService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all SIM cards' })
  findAll() {
    return this.simService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available SIM cards' })
  findAvailableSims() {
    return this.simService.findAvailableSims();
  }

  @Get('operator/:operator')
  @ApiOperation({ summary: 'Get SIMs by operator' })
  findByOperator(@Param('operator') operator: string) {
    return this.simService.findByOperator(operator);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SIM card by ID' })
  findOne(@Param('id') id: string) {
    return this.simService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update SIM card' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.simService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SIM card' })
  remove(@Param('id') id: string) {
    return this.simService.remove(+id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign SIM to user' })
  assignToUser(@Param('id') id: string, @Body() body: { userId: number; device: string }) {
    return this.simService.assignToUser(+id, body.userId, body.device);
  }

  @Patch(':id/unassign')
  @ApiOperation({ summary: 'Unassign SIM from user' })
  unassignFromUser(@Param('id') id: string) {
    return this.simService.unassignFromUser(+id);
  }
}
