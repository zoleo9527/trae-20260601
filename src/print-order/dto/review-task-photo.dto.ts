import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReviewTaskPhotoDto {
  @ApiProperty({ description: '审核备注' })
  @IsString()
  @IsNotEmpty()
  reviewNotes: string;

  @ApiPropertyOptional({ description: '退回原因（拒绝时必填）' })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
