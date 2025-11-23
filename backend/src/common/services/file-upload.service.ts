import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = './uploads';

  constructor() {
    // Ensure upload directories exist
    this.ensureDirectoryExists(this.uploadPath);
    this.ensureDirectoryExists(join(this.uploadPath, 'signatures'));
    this.ensureDirectoryExists(join(this.uploadPath, 'uat-documents'));
  }

  private ensureDirectoryExists(path: string): void {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }

  validateSignature(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid signature file type. Only JPG and PNG files are allowed.',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('Signature file size must not exceed 2MB');
    }
  }

  validateDocument(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
      'application/zip',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid document file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT, ZIP',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('Document file size must not exceed 10MB');
    }
  }

  async saveFile(file: Express.Multer.File, type: 'signature' | 'uat-document'): Promise<string> {
    const subFolder = type === 'signature' ? 'signatures' : 'uat-documents';
    const extension = this.getFileExtension(file.originalname);
    const uniqueFilename = `${uuidv4()}${extension}`;
    const filePath = join(this.uploadPath, subFolder, uniqueFilename);

    // Handle both buffer and path-based file storage
    let fileData: Buffer;
    
    if (file.buffer) {
      // File is stored in memory (memoryStorage)
      fileData = file.buffer;
    } else if (file.path) {
      // File is stored on disk (diskStorage) - read it
      fileData = readFileSync(file.path);
    } else {
      throw new BadRequestException('Invalid file upload - no data received');
    }

    writeFileSync(filePath, fileData);

    // Return relative path for database storage
    return `/${subFolder}/${uniqueFilename}`;
  }

  async saveBase64Signature(base64Data: string): Promise<string> {
    const matches = base64Data.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    
    if (!matches) {
      throw new BadRequestException('Invalid base64 signature format');
    }

    const extension = `.${matches[1]}`;
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Check size (2MB limit)
    if (buffer.length > 2 * 1024 * 1024) {
      throw new BadRequestException('Signature file size must not exceed 2MB');
    }

    const uniqueFilename = `${uuidv4()}${extension}`;
    const filePath = join(this.uploadPath, 'signatures', uniqueFilename);

    writeFileSync(filePath, buffer);

    return `/signatures/${uniqueFilename}`;
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot);
  }

  getFilePath(relativePath: string): string {
    return join(this.uploadPath, relativePath);
  }

  deleteFile(relativePath: string): void {
    const fullPath = this.getFilePath(relativePath);
    if (existsSync(fullPath)) {
      const fs = require('fs');
      fs.unlinkSync(fullPath);
    }
  }
}
