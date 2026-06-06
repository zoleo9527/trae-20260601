import { IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../../common/enums';

export class CreateAppointmentDto {
  @IsNotEmpty()
  carrierName: string;

  @IsNotEmpty()
  driverName: string;

  @IsNotEmpty()
  driverPhone: string;

  @IsNotEmpty()
  plateNumber: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledArrivalTime: string;

  @IsNotEmpty()
  cargoType: string;

  @IsOptional()
  cargoWeight?: number;

  @IsOptional()
  warehouseZone?: string;

  @IsNotEmpty()
  creatorId: string;
}

export class ApproveAppointmentDto {
  @IsNotEmpty()
  approverId: string;

  @IsOptional()
  remark?: string;
}

export class RejectAppointmentDto {
  @IsNotEmpty()
  approverId: string;

  @IsNotEmpty()
  rejectionReason: string;

  @IsOptional()
  remark?: string;
}

export class SupplementAppointmentDto {
  @IsNotEmpty()
  operatorId: string;

  @IsOptional()
  supplementNote?: string;

  @IsOptional()
  carrierName?: string;

  @IsOptional()
  driverName?: string;

  @IsOptional()
  driverPhone?: string;

  @IsOptional()
  plateNumber?: string;

  @IsOptional()
  cargoType?: string;

  @IsOptional()
  cargoWeight?: number;

  @IsOptional()
  remark?: string;
}

export class AssignDockDto {
  @IsNotEmpty()
  dockId: string;

  @IsNotEmpty()
  assignerId: string;

  @IsOptional()
  remark?: string;
}

export class CheckInDto {
  @IsNotEmpty()
  operatorId: string;

  @IsOptional()
  remark?: string;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsNotEmpty()
  operatorId: string;

  @IsOptional()
  remark?: string;
}

export class QueryAppointmentsDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  dockId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
