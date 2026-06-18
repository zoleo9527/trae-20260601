import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EscalateDto {
  @ApiProperty({ description: '升级原因', example: '客户对解决方案不满意，要求管理层介入' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
