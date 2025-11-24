import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto, UpdateAssetDto } from './dto/create-asset.dto'; // Import the DTO

@Injectable()
export class AssetManagementService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  async create(assetData: CreateAssetDto): Promise<Asset> { // Use the DTO
    // Generate asset ID
    const count = await this.assetRepository.count();
    const assetId = `AST${String(count + 1).padStart(6, '0')}`;

    const asset = this.assetRepository.create({
      ...assetData,
      assetId,
    });
    // TypeORM is smart and will only save fields that exist in the entity
    const savedAsset = await this.assetRepository.save(asset) as unknown as Asset;
    return savedAsset;
  }

  async findAll(query?: any): Promise<Asset[]> {
    const queryBuilder = this.assetRepository.createQueryBuilder('asset');

    if (query?.type) {
      queryBuilder.andWhere('asset.type = :type', { type: query.type });
    }
    if (query?.status) {
      queryBuilder.andWhere('asset.status = :status', { status: query.status });
    }
    if (query?.category) {
      queryBuilder.andWhere('asset.category = :category', { category: query.category });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  async update(id: number, updateData: UpdateAssetDto): Promise<Asset> { // Use the DTO
    await this.assetRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.assetRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
  }

  async getAssetsByUser(userId: number): Promise<Asset[]> {
    return await this.assetRepository.find({ where: { assignedTo: userId } });
  }

  async getAssetLifecycle(assetId: string) {
    const asset = await this.assetRepository.findOne({ where: { assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    return {
      assetId,
      currentStatus: asset.status,
      lifecycle: ['Procurement', 'Deployment', 'Maintenance', 'Retirement'],
      history: [], // This would be populated from an audit log table
    };
  }
}
