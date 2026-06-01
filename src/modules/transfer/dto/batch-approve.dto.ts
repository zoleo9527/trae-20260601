import { IsArray, IsEnum, IsString, IsOptional, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransferAction } from '../enums';

export class BatchApproveDto {
  @ApiProperty({ type: [String], description: '调拨单ID数组' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: [TransferAction.APPROVE, TransferAction.REJECT], description: '审批动作' })
  @IsEnum([TransferAction.APPROVE, TransferAction.REJECT])
  action: TransferAction.APPROVE | TransferAction.REJECT;

  @ApiProperty({ description: '审批备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '拒绝原因（拒绝时必填）', required: false })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
