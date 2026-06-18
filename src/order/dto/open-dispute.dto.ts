import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OpenDisputeDto {
  @ApiProperty({ description: '争议原因', example: '服务内容与约定不符' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
