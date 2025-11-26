import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PolicyManagementService } from './policy-management.service';

@ApiTags('Policy Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('policies')
export class PolicyManagementController {
  constructor(private readonly policyService: PolicyManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create policy' })
  create(@Body() createDto: any, @Request() req) {
    return this.policyService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies' })
  findAll() {
    return this.policyService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active policies' })
  findActivePolicies() {
    return this.policyService.findActivePolicies();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get policies by category' })
  findByCategory(@Param('category') category: string) {
    return this.policyService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy by ID' })
  findOne(@Param('id') id: string) {
    return this.policyService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update policy' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.policyService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete policy' })
  remove(@Param('id') id: string) {
    return this.policyService.remove(+id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve policy' })
  approve(@Param('id') id: string, @Request() req) {
    return this.policyService.approve(+id, req.user.userId);
  }
}
