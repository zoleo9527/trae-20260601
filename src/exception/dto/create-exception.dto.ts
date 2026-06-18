
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ExceptionType, SeverityLevel, TargetType } from '@prisma/client';

export class CreateExceptionDto {
  @IsEnum(ExceptionType)
  @IsNotEmpty()
  exceptionType: ExceptionType;

  @IsEnum(SeverityLevel)
  @IsNotEmpty()
  severity: SeverityLevel;

  @IsEnum(TargetType)
  @IsNotEmpty()
  targetType: TargetType;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsOptional()
  volunteerId?: string;

  @IsString()
  @IsOptional()
  recruitmentId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
