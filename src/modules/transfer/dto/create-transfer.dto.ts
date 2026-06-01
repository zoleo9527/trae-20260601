import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransferType, TransferPriority } from '../enums';
import { TransferItemDto } from './transfer-item.dto';

export class CreateTransferDto {
  @ApiProperty({ enum: TransferType, description: '调拨类型' })
  @IsEnum(TransferType)
  transferType: TransferType;

  @ApiProperty({ description: '调出门店ID' })
  @IsString()
  @IsNotEmpty()
  fromStoreId: string;

  @ApiProperty({ description: '调出门店名称' })
  @IsString()
  @IsNotEmpty()
  fromStoreName: string;

  @ApiProperty({ description: '调入门店ID' })
  @IsString()
  @IsNotEmpty()
  toStoreId: string;

  @ApiProperty({ description: '调入门店名称' })
  @IsString()
  @IsNotEmpty()
  toStoreName: string;

  @ApiProperty({ type: [TransferItemDto], description: '调拨明细' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @ApiProperty({ enum: TransferPriority, description: '优先级', required: false })
  @IsOptional()
  @IsEnum(TransferPriority)
  priority?: TransferPriority;

  @ApiProperty({ description: '期望日期', required: false })
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '门店ID' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: '门店名称' })
  @IsString()
  @IsNotEmpty()
  storeName: string;
}
