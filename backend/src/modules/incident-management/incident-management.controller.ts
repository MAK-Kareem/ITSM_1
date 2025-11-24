import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { IncidentManagementService } from './incident-management.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Incident Management')
@Controller('incidents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IncidentManagementController {
  constructor(private readonly incidentService: IncidentManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create new incident' })
  create(@Body() createIncidentDto: any) {
    return this.incidentService.create(createIncidentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incidents' })
  findAll(@Query() query: any) {
    return this.incidentService.findAll(query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get incident metrics' })
  getMetrics() {
    return this.incidentService.getMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by ID' })
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident' })
  update(@Param('id') id: string, @Body() updateIncidentDto: any) {
    return this.incidentService.update(+id, updateIncidentDto);
  }
}
