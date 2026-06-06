import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AdjustmentStatus, AdjustmentReason } from '../common/enums';

export class ProcessAdjustmentDto {
  @IsString()
  handlerId: string;

  @IsEnum(AdjustmentStatus)
  targetStatus: AdjustmentStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  returnReason?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class CreateAdjustmentDto {
  @IsString()
  studentId: string;

  @IsString()
  sourceBedId: string;

  @IsString()
  targetBedId: string;

  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @IsOptional()
  @IsString()
  reasonDetail?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
