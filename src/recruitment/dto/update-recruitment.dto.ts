
import { IsString, IsOptional, IsArray, IsInt, Min, IsEnum } from 'class-validator';
import { RecruitmentStatus } from '@prisma/client';

export class UpdateRecruitmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  requirements?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  quota?: number;

  @IsEnum(RecruitmentStatus)
  @IsOptional()
  status?: RecruitmentStatus;
}
