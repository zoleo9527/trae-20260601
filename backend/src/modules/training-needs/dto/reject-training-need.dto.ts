import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectTrainingNeedDto {
  @ApiProperty({ description: '驳回原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}