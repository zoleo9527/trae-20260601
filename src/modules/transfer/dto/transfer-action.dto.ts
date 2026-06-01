import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferActionDto {
  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '拒绝原因（拒绝时必填）', required: false })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
