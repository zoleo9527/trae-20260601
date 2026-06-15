import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PriorityLevel } from '../../common/enums/priority-level.enum';
import { IntakeStatus } from '../../common/enums/intake-status.enum';

export class UpdateIntakeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosisResult?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  repairNotes?: string;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;

  @ApiPropertyOptional({ enum: IntakeStatus })
  @IsEnum(IntakeStatus)
  @IsOptional()
  status?: IntakeStatus;

  @ApiPropertyOptional({ description: '分配维修师ID' })
  @IsString()
  @IsOptional()
  technicianId?: string;
}
