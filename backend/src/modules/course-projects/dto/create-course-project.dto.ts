import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateCourseProjectDto {
  @ApiProperty({ description: '关联的培训需求ID' })
  @IsString()
  @IsNotEmpty()
  trainingNeedId: string;

  @ApiProperty({ description: '课程名称' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '课程描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '课程目标' })
  @IsString()
  @IsOptional()
  objectives?: string;

  @ApiProperty({ description: '课程大纲' })
  @IsString()
  @IsOptional()
  outline?: string;

  @ApiProperty({ description: '讲师ID' })
  @IsString()
  @IsNotEmpty()
  instructorId: string;

  @ApiProperty({ description: '培训开始时间' })
  @IsDate()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({ description: '培训结束时间' })
  @IsDate()
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty({ description: '培训地点' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: '报名截止时间' })
  @IsDate()
  @IsOptional()
  enrollmentDeadline?: Date;

  @ApiProperty({ description: '最大参训人数' })
  @IsNumber()
  @IsNotEmpty()
  maxParticipants: number;
}