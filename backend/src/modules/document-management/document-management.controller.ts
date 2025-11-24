import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentManagementService } from './document-management.service';

@ApiTags('Document Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentManagementController {
  constructor(private readonly documentService: DocumentManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create new document' })
  create(@Body() createDto: any, @Request() req) {
    return this.documentService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.documentService.update(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }

  @Get('department/:department')
  @ApiOperation({ summary: 'Get documents by department' })
  findByDepartment(@Param('department') department: string) {
    return this.documentService.findByDepartment(department);
  }
}
