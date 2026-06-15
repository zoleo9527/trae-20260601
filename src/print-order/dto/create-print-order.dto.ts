import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, IsArray } from 'class-validator';
import { PriorityLevel } from '../../common/enums/priority-level.enum';

export class CreatePrintOrderDto {
  @ApiProperty({ description: '客户名称' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: '客户电话' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({ description: '客户微信' })
  @IsOptional()
  @IsString()
  customerWechat?: string;

  @ApiProperty({ description: '项目名称' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiProperty({ description: '内容描述' })
  @IsString()
  @IsNotEmpty()
  contentDescription: string;

  @ApiPropertyOptional({ description: '规格参数' })
  @IsOptional()
  specifications?: {
    width?: string;
    height?: string;
    material?: string;
    quantity?: number;
    unit?: string;
  };

  @ApiPropertyOptional({ description: '总价' })
  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @ApiPropertyOptional({ description: '定金' })
  @IsOptional()
  @IsNumber()
  deposit?: number;

  @ApiPropertyOptional({ description: '优先级', enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: '预计交付日期' })
  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ description: '设计师ID' })
  @IsOptional()
  @IsString()
  designerId?: string;
}
