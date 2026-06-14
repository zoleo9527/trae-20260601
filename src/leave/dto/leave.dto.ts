import { IsEnum, IsString, IsNotEmpty, IsArray, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { LeaveType } from '../../common/types/leave.type';

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType, { message: '请假类型不合法' })
  type: LeaveType;

  @IsDateString({}, { message: '开始日期格式不正确' })
  startDate: string;

  @IsDateString({}, { message: '结束日期格式不正确' })
  endDate: string;

  @IsString()
  @IsNotEmpty({ message: '请假理由不能为空' })
  reason: string;

  @IsArray()
  @IsOptional()
  attachments: string[];

  @IsNumber()
  @Min(1, { message: '涉及课程数量必须大于0' })
  lessonCount: number;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class UpdateLeaveMaterialDto {
  @IsArray()
  attachments: string[];

  @IsString()
  @IsOptional()
  supplementNote: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class ReviewLeaveDto {
  @IsEnum(['APPROVED', 'REJECTED', 'RETURNED', 'PENDING_MATERIAL'], { message: '审批动作不合法' })
  action: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'PENDING_MATERIAL';

  @IsString()
  @IsOptional()
  comment: string;

  @IsArray()
  @IsOptional()
  materialRequired: string[];

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class UrgeLeaveDto {
  @IsString()
  @IsOptional()
  urgencyReason: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class QueryLeaveListDto {
  @IsOptional()
  @IsEnum(['DRAFT', 'PENDING_AFFAIRS', 'PENDING_MATERIAL', 'URGENCY', 'RETURNED', 'APPROVED', 'REJECTED', 'CANCELLED'], { each: true })
  statuses?: string[];

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsString()
  currentHandlerId?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
