import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RunMatchingDto {
  @ApiProperty({ description: '需求单ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  intakeId: string;

  @ApiPropertyOptional({ description: '取前N个候选', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topN?: number = 5;
}
