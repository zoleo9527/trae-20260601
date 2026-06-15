import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class ConsentQueryDto {
  @ApiPropertyOptional({ description: '客户姓名/手机号搜索' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '工单编号' })
  @IsString()
  @IsOptional()
  orderNo?: string;

  @ApiPropertyOptional({ description: '是否已签署' })
  @IsOptional()
  isSigned?: boolean;
}
