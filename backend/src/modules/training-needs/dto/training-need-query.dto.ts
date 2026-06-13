import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString, IsDate } from 'class-validator';
import { TrainingNeedStatus, Urgency } from '../../entities/training-need.entity';

export class TrainingNeedQueryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  pageSize?: number = 10;

  @ApiProperty({ description: '状态', enum: TrainingNeedStatus, required: false })
  @IsEnum(TrainingNeedStatus)
  @IsOptional()
  status?: TrainingNeedStatus;

  @ApiProperty({ description: '部门', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: '紧急程度', enum: Urgency, required: false })
  @IsEnum(Urgency)
  @IsOptional()
  urgency?: Urgency;

  @ApiProperty({ description: '开始日期', required: false })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ description: '关键词（标题/描述）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;
}