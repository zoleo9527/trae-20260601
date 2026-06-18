import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDecimal, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { HousekeeperStatus } from '../../common/enums';

export class QueryHousekeeperDto extends PaginationDto {
  @ApiPropertyOptional({ description: '状态', enum: HousekeeperStatus })
  @IsOptional()
  status?: HousekeeperStatus;

  @ApiPropertyOptional({ description: '技能关键词' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: '最低评分' })
  @IsOptional()
  @Type(() => Number)
  @IsDecimal()
  minRating?: number;

  @ApiPropertyOptional({ description: '覆盖区域关键词' })
  @IsOptional()
  @IsString()
  coverageArea?: string;
}
