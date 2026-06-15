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

class CheckItemsDto {
  @ApiProperty({ description: '屏幕显示' })
  @IsBoolean()
  screenWorks: boolean;

  @ApiProperty({ description: '触摸功能' })
  @IsBoolean()
  touchWorks: boolean;

  @ApiProperty({ description: '摄像头' })
  @IsBoolean()
  cameraWorks: boolean;

  @ApiProperty({ description: '扬声器' })
  @IsBoolean()
  speakerWorks: boolean;

  @ApiProperty({ description: '麦克风' })
  @IsBoolean()
  micWorks: boolean;

  @ApiProperty({ description: '充电' })
  @IsBoolean()
  chargeWorks: boolean;

  @ApiProperty({ description: '按键' })
  @IsBoolean()
  buttonWorks: boolean;

  @ApiProperty({ description: 'WiFi' })
  @IsBoolean()
  wifiWorks: boolean;

  @ApiProperty({ description: '指纹识别' })
  @IsBoolean()
  fingerprintWorks: boolean;

  @ApiProperty({ description: '面容ID' })
  @IsBoolean()
  faceIdWorks: boolean;
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

  @ApiPropertyOptional({
    description: '逐项检查结果（10项），不提供则拒绝并引导至新接口',
    type: CheckItemsDto,
  })
  @IsObject()
  @IsOptional()
  checkItems?: CheckItemsDto;

  @ApiPropertyOptional({ description: '不合格项说明' })
  @IsString()
  @IsOptional()
  failedItems?: string;
}
