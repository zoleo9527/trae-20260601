import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PriorityLevel } from '../../common/enums/priority-level.enum';

export class UpdateIntakeDto {
  @ApiPropertyOptional({ description: '诊断结果（店长、维修师可改）' })
  @IsString()
  @IsOptional()
  diagnosisResult?: string;

  @ApiPropertyOptional({ description: '维修备注（店长、维修师可改）' })
  @IsString()
  @IsOptional()
  repairNotes?: string;

  @ApiPropertyOptional({ enum: PriorityLevel, description: '优先级（所有角色可改）' })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: '分配维修师ID（前台、店长可改）' })
  @IsString()
  @IsOptional()
  technicianId?: string;
}
