import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ description: '争议解决方案', example: '已和客户协商，退还50%费用' })
  @IsString()
  @IsNotEmpty()
  resolution: string;
}
