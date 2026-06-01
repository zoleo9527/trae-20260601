import { PartialType } from '@nestjs/swagger';
import { CreateTransferDto } from './create-transfer.dto';
import { TransferItemDto } from './transfer-item.dto';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransferDto extends PartialType(CreateTransferDto) {
  @ApiProperty({ type: [TransferItemDto], description: '调拨明细', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items?: TransferItemDto[];
}
