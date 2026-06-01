import { IsString, IsNumber, IsPositive, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferItemDto {
  @ApiProperty({ description: '药品编码' })
  @IsString()
  @IsNotEmpty()
  medicineCode: string;

  @ApiProperty({ description: '药品名称' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ description: '批号' })
  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @ApiProperty({ description: '有效期' })
  @IsString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ description: '数量' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: '单位' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: '售价' })
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @ApiProperty({ description: '小计' })
  @IsNumber()
  @IsPositive()
  subtotal: number;

  @ApiProperty({ description: '库存记录ID', required: false })
  @IsString()
  @IsOptional()
  inventoryId?: string;
}
