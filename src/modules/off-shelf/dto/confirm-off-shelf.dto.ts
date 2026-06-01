import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmOffShelfDto {
  @ApiProperty({ description: '复核备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
