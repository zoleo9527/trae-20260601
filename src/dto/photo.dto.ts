import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsDefined } from 'class-validator';
import { PhotoType, PhotoStatus } from '../entities/photo.entity';

export class UploadPhotoDto {
  @IsDefined()
  @IsUUID()
  installationId: string;

  @IsDefined()
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
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class VerifyPhotoDto {
  @IsDefined()
  @IsEnum(PhotoStatus)
  status: PhotoStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}