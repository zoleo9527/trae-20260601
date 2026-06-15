import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckItemsDto {
  @ApiProperty({ description: '屏幕显示', type: Boolean })
  @IsBoolean({ message: 'screenWorks 必须为布尔值' })
  screenWorks: boolean;

  @ApiProperty({ description: '触摸功能', type: Boolean })
  @IsBoolean({ message: 'touchWorks 必须为布尔值' })
  touchWorks: boolean;

  @ApiProperty({ description: '摄像头', type: Boolean })
  @IsBoolean({ message: 'cameraWorks 必须为布尔值' })
  cameraWorks: boolean;

  @ApiProperty({ description: '扬声器', type: Boolean })
  @IsBoolean({ message: 'speakerWorks 必须为布尔值' })
  speakerWorks: boolean;

  @ApiProperty({ description: '麦克风', type: Boolean })
  @IsBoolean({ message: 'micWorks 必须为布尔值' })
  micWorks: boolean;

  @ApiProperty({ description: '充电', type: Boolean })
  @IsBoolean({ message: 'chargeWorks 必须为布尔值' })
  chargeWorks: boolean;

  @ApiProperty({ description: '按键', type: Boolean })
  @IsBoolean({ message: 'buttonWorks 必须为布尔值' })
  buttonWorks: boolean;

  @ApiProperty({ description: 'WiFi', type: Boolean })
  @IsBoolean({ message: 'wifiWorks 必须为布尔值' })
  wifiWorks: boolean;

  @ApiProperty({ description: '指纹识别', type: Boolean })
  @IsBoolean({ message: 'fingerprintWorks 必须为布尔值' })
  fingerprintWorks: boolean;

  @ApiProperty({ description: '面容ID', type: Boolean })
  @IsBoolean({ message: 'faceIdWorks 必须为布尔值' })
  faceIdWorks: boolean;
}

export class CreateQualityCheckDto {
  @ApiProperty({ description: '10项逐项检查结果（全部必填）', type: CheckItemsDto })
  @ValidateNested({ each: false })
  @Type(() => CheckItemsDto)
  checkItems: CheckItemsDto;

  @ApiProperty({ description: '是否通过' })
  @IsBoolean()
  passed: boolean;

  @ApiProperty({ description: '质检备注' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiPropertyOptional({ description: '不合格项说明（不通过时）' })
  @IsString()
  @IsOptional()
  failedItems?: string;
}
