import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CheckItemsDto } from './quality-check.dto';

class QualityCheckDto {
  @ApiProperty({ description: '是否通过' })
  @IsBoolean()
  passed: boolean;

  @ApiProperty({ description: '质检备注' })
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
  @ValidateNested()
  @Type(() => QualityCheckDto)
  qualityCheck: QualityCheckDto;

  @ApiProperty({
    description: '10项逐项检查结果（全部必填），缺少任何一项将返回校验错误',
    type: CheckItemsDto,
  })
  @ValidateNested()
  @Type(() => CheckItemsDto)
  checkItems: CheckItemsDto;

  @ApiPropertyOptional({ description: '不合格项说明' })
  @IsString()
  @IsOptional()
  failedItems?: string;
}
