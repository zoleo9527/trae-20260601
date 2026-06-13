import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveTrainingNeedDto {
  @ApiProperty({ description: '审批备注', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}