import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SubmitPhotoReturnDto {
  @ApiProperty({ description: '照片URL列表' })
  @IsArray()
  @IsNotEmpty()
  photoUrls: string[];

  @ApiPropertyOptional({ description: '回传说明' })
  @IsOptional()
  @IsString()
  returnNotes?: string;
}
