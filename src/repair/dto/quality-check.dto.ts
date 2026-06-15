import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
} from 'class-validator';

export class CreateQualityCheckDto {
  @ApiProperty({
    description: '检查项目',
    type: 'object',
    properties: {
      screenWorks: { type: 'boolean' },
      touchWorks: { type: 'boolean' },
      cameraWorks: { type: 'boolean' },
      speakerWorks: { type: 'boolean' },
      micWorks: { type: 'boolean' },
      chargeWorks: { type: 'boolean' },
      buttonWorks: { type: 'boolean' },
      wifiWorks: { type: 'boolean' },
      fingerprintWorks: { type: 'boolean' },
      faceIdWorks: { type: 'boolean' },
    },
  })
  @IsObject()
  checkItems: {
    screenWorks: boolean;
    touchWorks: boolean;
    cameraWorks: boolean;
    speakerWorks: boolean;
    micWorks: boolean;
    chargeWorks: boolean;
    buttonWorks: boolean;
    wifiWorks: boolean;
    fingerprintWorks: boolean;
    faceIdWorks: boolean;
  };

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
