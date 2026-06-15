import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { AttachmentType } from '../../common/enums/attachment-type.enum';

export class CreateAttachmentDto {
  @ApiProperty({ description: '附件类型', enum: AttachmentType })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({ description: '存储文件名' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({ description: '原始文件名' })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiProperty({ description: 'MIME类型' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: '文件大小' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: '文件访问URL（或base64 data URI）' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ description: '文件元数据' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: '说明' })
  @IsString()
  @IsOptional()
  description?: string;
}
