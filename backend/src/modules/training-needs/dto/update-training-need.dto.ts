import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Urgency } from '../../entities/training-need.entity';

export class UpdateTrainingNeedDto {
  @ApiProperty({ description: '需求标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '需求描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '部门', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: '期望日期', required: false })
  @IsDate()
  @IsOptional()
  expectedDate?: Date;

  @ApiProperty({ description: '预计参训人数', required: false })
  @IsNumber()
  @IsOptional()
  participantCount?: number;

  @ApiProperty({ description: '预算', required: false })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({ description: '紧急程度', enum: Urgency, required: false })
  @IsEnum(Urgency)
  @IsOptional()
  urgency?: Urgency;

  @ApiProperty({ description: '附件列表', required: false })
  @IsOptional()
  attachments?: string[];
}