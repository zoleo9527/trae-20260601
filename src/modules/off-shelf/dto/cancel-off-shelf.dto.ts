import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOffShelfDto {
  @ApiProperty({ description: '取消原因', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
