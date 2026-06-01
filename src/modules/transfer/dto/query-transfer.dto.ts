import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { TransferStatus, TransferType, TransferPriority } from '../enums';

export class QueryTransferDto extends PaginationQueryDto {
  @ApiProperty({ enum: TransferStatus, description: '状态', required: false })
  @IsOptional()
  @IsEnum(TransferStatus)
  currentStatus?: TransferStatus;

  @ApiProperty({ enum: TransferType, description: '调拨类型', required: false })
  @IsOptional()
  @IsEnum(TransferType)
  transferType?: TransferType;

  @ApiProperty({ enum: TransferPriority, description: '优先级', required: false })
  @IsOptional()
  @IsEnum(TransferPriority)
  priority?: TransferPriority;

  @ApiProperty({ description: '调出门店ID', required: false })
  @IsOptional()
  @IsString()
  fromStoreId?: string;

  @ApiProperty({ description: '调入门店ID', required: false })
  @IsOptional()
  @IsString()
  toStoreId?: string;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;
}
