import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateMakeupDto {
  @IsString()
  @IsNotEmpty()
  leaveId: string;

  @IsArray()
  @IsOptional()
  studentIds: string[];

  @IsArray()
  @IsOptional()
  originalLessonDates: string[];

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class ProposeMakeupDto {
  @IsArray()
  proposedMakeupDates: string[];

  @IsString()
  @IsOptional()
  proposedMakeupTeacherId: string;

  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class ConfirmMakeupDto {
  @IsEnum(['ALL_CONFIRMED', 'PARTIAL_CONFIRMED', 'REJECTED'], { message: '确认类型不合法' })
  action: 'ALL_CONFIRMED' | 'PARTIAL_CONFIRMED' | 'REJECTED';

  @IsArray()
  @IsOptional()
  confirmedStudentIds: string[];

  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class ScheduleMakeupDto {
  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class MarkCompleteDto {
  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class QueryMakeupListDto {
  @IsOptional()
  @IsEnum(['PENDING_TEACHER_CONFIRM', 'PENDING_PARENT_CONFIRM', 'PENDING_SCHEDULE', 'PENDING_EXECUTE', 'COMPLETED', 'CANCELLED', 'BLOCKED'], { each: true })
  statuses?: string[];

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  leaveId?: string;

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
