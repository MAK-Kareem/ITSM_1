import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentManagementService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createDto: any, userId: number): Promise<Document> {
    const docNumber = await this.generateDocumentNumber();
    
    const document = this.documentRepository.create({
      documentNumber: docNumber,
      title: createDto.title,
      description: createDto.description,
      documentType: createDto.documentType,
      category: createDto.category,
      filePath: createDto.filePath,
      fileSize: createDto.fileSize,
      version: createDto.version || '1.0',
      ownerId: userId,
      department: createDto.department,
      accessLevel: createDto.accessLevel || 'internal',
      tags: createDto.tags,
      metadata: createDto.metadata,
    });

    return this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(id: number, updateDto: any): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDto);
    return this.documentRepository.save(document);
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await this.documentRepository.remove(document);
  }

  async findByDepartment(department: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { department },
      order: { createdAt: 'DESC' },
    });
  }

  private async generateDocumentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.documentRepository.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `DOC-${year}-${sequence}`;
  }
}
