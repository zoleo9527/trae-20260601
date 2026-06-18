import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MatchingStatus } from '../../common/enums';

export class QueryMatchingDto extends PaginationDto {
  @ApiPropertyOptional({ description: '需求单ID (UUID)' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiPropertyOptional({ description: '匹配轮次' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  round?: number;

  @ApiPropertyOptional({ description: '状态', enum: MatchingStatus })
  @IsOptional()
  status?: MatchingStatus;

  @ApiPropertyOptional({ description: '阿姨ID (UUID)' })
  @IsOptional()
  @IsUUID()
  housekeeperId?: string;
}
