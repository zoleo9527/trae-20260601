import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IntakeStatus, IntakeBlockReason } from '../../common/enums';
import { Role } from '../../common/enums/role.enum';

export class QueryIntakeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '需求单状态',
    enum: IntakeStatus,
  })
  @IsEnum(IntakeStatus)
  @IsOptional()
  status?: IntakeStatus;

  @ApiPropertyOptional({
    description: '卡住原因',
    enum: IntakeBlockReason,
  })
  @IsEnum(IntakeBlockReason)
  @IsOptional()
  blockReason?: IntakeBlockReason;

  @ApiPropertyOptional({
    description: '责任人角色',
    enum: Role,
  })
  @IsEnum(Role)
  @IsOptional()
  ownerRole?: Role;

  @ApiPropertyOptional({ description: '责任人ID' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerId?: string;

  @ApiPropertyOptional({ description: '服务类型', example: '日常保洁' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  serviceType?: string;
}
