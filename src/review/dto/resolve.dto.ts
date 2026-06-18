import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveDto {
  @ApiProperty({ description: '解决方案', example: '已为客户更换家政员并赠送一次免费服务' })
  @IsString()
  @IsNotEmpty()
  resolution: string;
}
