import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { IntakeStatus } from '../../common/enums/intake-status.enum';

export class IntakeQueryDto {
  @ApiPropertyOptional({ description: '按状态筛选' })
  @IsEnum(IntakeStatus)
  @IsOptional()
  status?: IntakeStatus;

  @ApiPropertyOptional({ description: '按关键词搜索（客户姓名/手机/工单编号）' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '维修师ID' })
  @IsString()
  @IsOptional()
  technicianId?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number = 20;
}
