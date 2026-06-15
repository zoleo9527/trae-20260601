import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { PrintOrderStatus } from '../../common/enums/print-order-status.enum';
import { PriorityLevel } from '../../common/enums/priority-level.enum';

export class PrintOrderQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ description: '状态', enum: PrintOrderStatus })
  @IsOptional()
  @IsEnum(PrintOrderStatus)
  status?: PrintOrderStatus;

  @ApiPropertyOptional({ description: '优先级', enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '设计师ID' })
  @IsOptional()
  @IsString()
  designerId?: string;

  @ApiPropertyOptional({ description: '安装队长ID' })
  @IsOptional()
  @IsString()
  installLeaderId?: string;
}
