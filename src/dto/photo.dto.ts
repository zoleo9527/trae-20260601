import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PhotoType, PhotoStatus } from '../entities/photo.entity';

export class UploadPhotoDto {
  @IsUUID()
  installationId: string;

  @IsEnum(PhotoType)
  type: PhotoType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PhotoQueryDto {
  @IsOptional()
  @IsUUID()
  installationId?: string;

  @IsOptional()
  @IsEnum(PhotoType)
  type?: PhotoType;

  @IsOptional()
  @IsEnum(PhotoStatus)
  status?: PhotoStatus;

  @IsOptional()
  @IsUUID()
  uploadedById?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'uploadedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class VerifyPhotoDto {
  @IsEnum(PhotoStatus)
  status: PhotoStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}