import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TransferTrainingNeedDto {
  @ApiProperty({ description: '目标培训经理ID' })
  @IsString()
  @IsNotEmpty()
  targetManagerId: string;

  @ApiProperty({ description: '转派备注', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}