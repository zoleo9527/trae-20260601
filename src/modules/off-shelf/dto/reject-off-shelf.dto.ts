import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectOffShelfDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  rejectReason: string;

  @ApiProperty({ description: '复核备注', required: false })
  remark?: string;
}
