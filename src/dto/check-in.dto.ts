import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CheckInStatus } from '../common/enums';

export class ProcessCheckInDto {
  @IsString()
  handlerId: string;

  @IsEnum(CheckInStatus)
  targetStatus: CheckInStatus;

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

export class CreateCheckInDto {
  @IsString()
  studentId: string;

  @IsString()
  bedId: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
