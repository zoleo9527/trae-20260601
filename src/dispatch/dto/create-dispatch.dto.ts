import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDispatchDto {
  @ApiProperty({ description: '报修单ID' })
  @IsString()
  @IsNotEmpty()
  repairOrderId: string;

  @ApiProperty({ description: '维修师傅ID' })
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiProperty({ description: '维修师傅姓名' })
  @IsString()
  @IsNotEmpty()
  workerName: string;

  @ApiProperty({ description: '派单备注', required: false })
  @IsString()
  @IsOptional()
  dispatchNote?: string;

  @ApiProperty({ description: '派单人ID' })
  @IsString()
  @IsNotEmpty()
  dispatcherId: string;

  @ApiProperty({ description: '派单人姓名' })
  @IsString()
  @IsNotEmpty()
  dispatcherName: string;
}
