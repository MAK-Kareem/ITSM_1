import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AssetManagementService } from './asset-management.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CreateAssetDto, UpdateAssetDto } from './dto/create-asset.dto'; // Import the new DTO

@ApiTags('Asset Management')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetManagementController {
  constructor(private readonly assetService: AssetManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create new asset' })
  create(@Body() createAssetDto: CreateAssetDto) { // Use the DTO instead of 'any'
    return this.assetService.create(createAssetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  findAll(@Query() query: any) {
    return this.assetService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) { // Use the DTO instead of 'any'
    return this.assetService.update(+id, updateAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset' })
  remove(@Param('id') id: string) {
    return this.assetService.remove(+id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get assets by user' })
  getAssetsByUser(@Param('userId') userId: string) {
    return this.assetService.getAssetsByUser(+userId);
  }

  @Get('lifecycle/:assetId')
  @ApiOperation({ summary: 'Get asset lifecycle' })
  getAssetLifecycle(@Param('assetId') assetId: string) {
    return this.assetService.getAssetLifecycle(assetId);
  }
}
