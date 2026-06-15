import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo, PhotoStatus, PhotoType } from '../entities/photo.entity';
import { Installation } from '../entities/installation.entity';
import { User } from '../entities/user.entity';
import { UploadPhotoDto, PhotoQueryDto, VerifyPhotoDto } from '../dto/photo.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PhotoService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(uploadDto: UploadPhotoDto, file: Express.Multer.File, user: User): Promise<Photo> {
    const installation = await this.installationRepository.findOne({ where: { id: uploadDto.installationId } });
    if (!installation) {
      throw new NotFoundException('安装工单不存在');
    }
    
    const photo = this.photoRepository.create({
      installationId: uploadDto.installationId,
      uploadedById: user.id,
      type: uploadDto.type,
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype,
      description: uploadDto.description,
    });
    
    return this.photoRepository.save(photo);
  }

  async findAll(query: PhotoQueryDto): Promise<{ data: Photo[]; total: number }> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    
    const queryBuilder = this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('photo.installation', 'installation');

    if (filters.installationId) {
      queryBuilder.andWhere('photo.installationId = :installationId', { installationId: filters.installationId });
    }
    if (filters.type) {
      queryBuilder.andWhere('photo.type = :type', { type: filters.type });
    }
    if (filters.status) {
      queryBuilder.andWhere('photo.status = :status', { status: filters.status });
    }
    if (filters.uploadedById) {
      queryBuilder.andWhere('photo.uploadedById = :uploadedById', { uploadedById: filters.uploadedById });
    }

    queryBuilder.orderBy(`photo.${sortBy}`, sortOrder);
    
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'installation'],
    });
    if (!photo) {
      throw new NotFoundException('照片不存在');
    }
    return photo;
  }

  async findByInstallation(installationId: string): Promise<Photo[]> {
    return this.photoRepository.find({
      where: { installationId },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'ASC' },
    });
  }

  async verify(id: string, verifyDto: VerifyPhotoDto, user: User): Promise<Photo> {
    const photo = await this.findOne(id);
    
    photo.status = verifyDto.status;
    photo.verifiedBy = user.id;
    photo.verifiedAt = new Date();
    
    return this.photoRepository.save(photo);
  }

  async verifyByInstallation(installationId: string, verifyDto: VerifyPhotoDto, user: User): Promise<Photo[]> {
    const photos = await this.findByInstallation(installationId);
    
    for (const photo of photos) {
      photo.status = verifyDto.status;
      photo.verifiedBy = user.id;
      photo.verifiedAt = new Date();
    }
    
    return this.photoRepository.save(photos);
  }

  async remove(id: string): Promise<void> {
    const photo = await this.findOne(id);
    
    const filePath = path.join(__dirname, '..', '..', photo.filePath.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await this.photoRepository.remove(photo);
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }
}