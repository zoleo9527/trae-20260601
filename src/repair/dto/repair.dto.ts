import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';

class QualityCheckDto {
  @ApiProperty()
  @IsBoolean()
  passed: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes: string;
}

export class SubmitDiagnosisDto {
  @ApiProperty({ description: '诊断结果' })
  @IsString()
  @IsNotEmpty()
  diagnosisResult: string;

  @ApiPropertyOptional({ description: '维修备注' })
  @IsString()
  @IsOptional()
  repairNotes?: string;
}

export class SubmitQualityCheckDto {
  @ApiProperty({ type: QualityCheckDto })
  @IsObject()
  qualityCheck: QualityCheckDto;
}
