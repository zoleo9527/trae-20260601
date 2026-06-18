import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CloseDto {
  @ApiProperty({ description: '关闭原因', example: '客户拒绝接受解决方案，无法进一步协调' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
