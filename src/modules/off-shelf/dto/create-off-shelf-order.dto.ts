import { IsEnum, IsString, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OffShelfReason } from '../enums/off-shelf-reason.enum';
import { OffShelfItemDto } from './off-shelf-item.dto';

export class CreateOffShelfOrderDto {
  @ApiProperty({ description: '下架原因', enum: OffShelfReason })
  @IsEnum(OffShelfReason)
  reason: OffShelfReason;

  @ApiProperty({ description: '原因详情', required: false })
  @IsOptional()
  @IsString()
  reasonDetail?: string;

  @ApiProperty({ description: '下架药品明细', type: [OffShelfItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OffShelfItemDto)
  items: OffShelfItemDto[];
}
