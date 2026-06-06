import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { RepairCategory, UrgencyLevel } from '../interfaces/repair.interface';

export class CreateRepairDto {
  @ApiProperty({ description: '报修标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '报修描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '报修类别', enum: ['electrical', 'plumbing', 'carpentry', 'appliance', 'other'] })
  @IsEnum(['electrical', 'plumbing', 'carpentry', 'appliance', 'other'])
  category: RepairCategory;

  @ApiProperty({ description: '紧急程度', enum: ['low', 'medium', 'high', 'urgent'] })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  urgency: UrgencyLevel;

  @ApiProperty({ description: '位置' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: '宿舍号', required: false })
  @IsString()
  @IsOptional()
  dormitory?: string;

  @ApiProperty({ description: '报修人姓名' })
  @IsString()
  @IsNotEmpty()
  reporterName: string;

  @ApiProperty({ description: '报修人电话' })
  @IsString()
  @IsNotEmpty()
  reporterPhone: string;

  @ApiProperty({ description: '报修人ID' })
  @IsString()
  @IsNotEmpty()
  reporterId: string;

  @ApiProperty({ description: '是否存在责任不清', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  hasUnclearResponsibility?: boolean;

  @ApiProperty({ description: '责任不清备注', required: false })
  @IsString()
  @IsOptional()
  responsibilityNote?: string;
}
