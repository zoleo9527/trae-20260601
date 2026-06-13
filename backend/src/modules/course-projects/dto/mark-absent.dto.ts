import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class MarkAbsentDto {
  @ApiProperty({ description: '缺席原因', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}