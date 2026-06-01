import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitOffShelfDto {
  @ApiProperty({ description: '提交备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
