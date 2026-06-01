import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OffShelfItemDto {
  @ApiProperty({ description: '库存ID' })
  @IsString()
  inventoryId: string;

  @ApiProperty({ description: '药品名称' })
  @IsString()
  medicineName: string;

  @ApiProperty({ description: '批次号' })
  @IsString()
  batchNo: string;

  @ApiProperty({ description: '有效期' })
  @IsString()
  expiryDate: string;

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '单位' })
  @IsString()
  unit: string;
}
