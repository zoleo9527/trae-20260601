import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfReason } from '../enums/off-shelf-reason.enum';

export class QueryOffShelfDto extends PaginationQueryDto {
  @ApiProperty({ description: '状态', enum: OffShelfStatus, required: false })
  @IsOptional()
  @IsEnum(OffShelfStatus)
  currentStatus?: OffShelfStatus;

  @ApiProperty({ description: '下架原因', enum: OffShelfReason, required: false })
  @IsOptional()
  @IsEnum(OffShelfReason)
  reason?: OffShelfReason;

  @ApiProperty({ description: '门店ID', required: false })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;
}
