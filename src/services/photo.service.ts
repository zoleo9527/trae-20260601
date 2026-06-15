import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo, PhotoStatus, PhotoType } from '../entities/photo.entity';
import { Installation } from '../entities/installation.entity';
import { InstallationRecord, RecordType } from '../entities/installation-record.entity';
import { User } from '../entities/user.entity';
import { UploadPhotoDto, PhotoQueryDto, VerifyPhotoDto } from '../dto/photo.dto';
import * as fs from 'fs';
import * as path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

@Injectable()
export class PhotoService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    @InjectRepository(InstallationRecord)
    private recordRepository: Repository<InstallationRecord>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(uploadDto: UploadPhotoDto, file: MulterFile, user: User): Promise<Photo> {
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
    const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'DESC', ...filters } = query;
    
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
      relations: {
        uploadedBy: true,
        installation: true,
      },
    });
    if (!photo) {
      throw new NotFoundException('照片不存在');
    }
    return photo;
  }

  async findByInstallation(installationId: string): Promise<Photo[]> {
    return this.photoRepository.find({
      where: { installationId },
      relations: {
        uploadedBy: true,
      },
      order: { uploadedAt: 'ASC' },
    });
  }

  async verify(id: string, verifyDto: VerifyPhotoDto, user: User): Promise<Photo> {
    const photo = await this.findOne(id);
    
    const previousStatus = photo.status;
    photo.status = verifyDto.status;
    photo.verifiedBy = user.id;
    photo.verifiedAt = new Date();
    
    const saved = await this.photoRepository.save(photo);
    
    const statusText = verifyDto.status === PhotoStatus.VERIFIED ? '审核通过' : '审核驳回';
    const reason = verifyDto.reason ? `，原因：${verifyDto.reason}` : '';
    await this.recordRepository.save({
      installationId: photo.installationId,
      operatorId: user.id,
      type: RecordType.COMMENT,
      content: `照片审核${statusText}${reason}`,
    });
    
    return saved;
  }

  async verifyByInstallation(installationId: string, verifyDto: VerifyPhotoDto, user: User): Promise<Photo[]> {
    const photos = await this.findByInstallation(installationId);
    
    for (const photo of photos) {
      photo.status = verifyDto.status;
      photo.verifiedBy = user.id;
      photo.verifiedAt = new Date();
    }
    
    const saved = await this.photoRepository.save(photos);
    
    const statusText = verifyDto.status === PhotoStatus.VERIFIED ? '全部审核通过' : '全部审核驳回';
    const reason = verifyDto.reason ? `，原因：${verifyDto.reason}` : '';
    await this.recordRepository.save({
      installationId,
      operatorId: user.id,
      type: RecordType.COMMENT,
      content: `工单照片${statusText}${reason}`,
    });
    
    return saved;
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
