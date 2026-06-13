import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Urgency } from '../../entities/training-need.entity';

export class CreateTrainingNeedDto {
  @ApiProperty({ description: '需求标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '需求描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '部门' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: '期望日期' })
  @IsDate()
  @IsNotEmpty()
  expectedDate: Date;

  @ApiProperty({ description: '预计参训人数' })
  @IsNumber()
  @IsNotEmpty()
  participantCount: number;

  @ApiProperty({ description: '预算' })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({ description: '紧急程度', enum: Urgency })
  @IsEnum(Urgency)
  @IsOptional()
  urgency?: Urgency;

  @ApiProperty({ description: '附件列表', required: false })
  @IsOptional()
  attachments?: string[];
}