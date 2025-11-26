import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { HelpdeskService } from './helpdesk.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Helpdesk')
@Controller('helpdesk/tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HelpdeskController {
  constructor(private readonly helpdeskService: HelpdeskService) {}

  @Post()
  @ApiOperation({ summary: 'Create new ticket' })
  create(@Body() createTicketDto: any) {
    return this.helpdeskService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  findAll(@Query() query: any) {
    return this.helpdeskService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  getStats() {
    return this.helpdeskService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.helpdeskService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  update(@Param('id') id: string, @Body() updateTicketDto: any) {
    return this.helpdeskService.update(+id, updateTicketDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  addComment(@Param('id') id: string, @Body() comment: any) {
    return this.helpdeskService.addComment(+id, comment);
  }
}
