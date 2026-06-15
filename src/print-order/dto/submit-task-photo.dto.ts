import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';

export class SubmitTaskPhotoDto {
  @ApiProperty({ description: '照片URL列表' })
  @IsArray()
  @IsNotEmpty()
  photoUrls: string[];

  @ApiPropertyOptional({ description: '回传说明' })
  @IsOptional()
  @IsString()
  returnNotes?: string;
}
