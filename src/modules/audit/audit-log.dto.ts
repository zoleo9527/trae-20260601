import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class QueryAuditLogDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '模块名称', required: false })
  module?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '操作类型', required: false })
  action?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '操作人ID', required: false })
  operatorId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '门店ID', required: false })
  storeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '开始时间 (ISO格式)', required: false })
  startTime?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '结束时间 (ISO格式)', required: false })
  endTime?: string;
}

export interface CreateAuditLogDto {
  module: string;
  action: string;
  entityId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  remark?: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  storeId?: string;
  storeName?: string;
  requestId?: string;
  success?: boolean;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
}
