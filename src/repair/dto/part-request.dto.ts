import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
  IsEnum,
} from 'class-validator';

export class CreatePartRequestDto {
  @ApiProperty({ description: '备件名称' })
  @IsString()
  @IsNotEmpty()
  partName: string;

  @ApiPropertyOptional({
    description: '备件详细信息',
    type: 'object',
    properties: {
      partNo: { type: 'string' },
      brand: { type: 'string' },
      spec: { type: 'string' },
      supplier: { type: 'string' },
    },
  })
  @IsObject()
  @IsOptional()
  partInfo?: {
    partNo?: string;
    brand?: string;
    spec?: string;
    supplier?: string;
  };

  @ApiProperty({ description: '数量', default: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: '预估费用' })
  @IsNumber()
  estimatedCost: number;

  @ApiProperty({ description: '申请原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ConfirmPartArrivalDto {
  @ApiPropertyOptional({ description: '到货备注' })
  @IsString()
  @IsOptional()
  arrivalNotes?: string;
}
