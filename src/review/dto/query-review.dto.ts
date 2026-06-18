import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReviewStatus } from '../../common/enums/review-status.enum';

export class QueryReviewDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', example: 20 })
  pageSize?: number;

  @ApiPropertyOptional({ description: '状态', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: '订单ID', example: 'uuid-xxx-xxx' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: '家政员ID', example: 'uuid-xxx-xxx' })
  @IsUUID()
  @IsOptional()
  housekeeperId?: string;
}
