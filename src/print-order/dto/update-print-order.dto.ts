import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { PriorityLevel } from '../../common/enums/priority-level.enum';

export class UpdatePrintOrderDto {
  @ApiPropertyOptional({ description: '客户名称' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: '客户电话' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: '项目名称' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: '内容描述' })
  @IsOptional()
  @IsString()
  contentDescription?: string;

  @ApiPropertyOptional({ description: '设计备注' })
  @IsOptional()
  @IsString()
  designNotes?: string;

  @ApiPropertyOptional({ description: '喷绘备注' })
  @IsOptional()
  @IsString()
  printNotes?: string;

  @ApiPropertyOptional({ description: '优先级', enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: '总价' })
  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @ApiPropertyOptional({ description: '预计交付日期' })
  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ description: '设计师ID' })
  @IsOptional()
  @IsString()
  designerId?: string;

  @ApiPropertyOptional({ description: '喷绘操作员ID' })
  @IsOptional()
  @IsString()
  printOperatorId?: string;

  @ApiPropertyOptional({ description: '安装队长ID' })
  @IsOptional()
  @IsString()
  installLeaderId?: string;
}
