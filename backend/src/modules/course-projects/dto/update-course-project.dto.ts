import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsNumber, IsOptional } from 'class-validator';

export class UpdateCourseProjectDto {
  @ApiProperty({ description: '课程名称', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '课程描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '课程目标', required: false })
  @IsString()
  @IsOptional()
  objectives?: string;

  @ApiProperty({ description: '课程大纲', required: false })
  @IsString()
  @IsOptional()
  outline?: string;

  @ApiProperty({ description: '讲师ID', required: false })
  @IsString()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({ description: '培训开始时间', required: false })
  @IsDate()
  @IsOptional()
  startTime?: Date;

  @ApiProperty({ description: '培训结束时间', required: false })
  @IsDate()
  @IsOptional()
  endTime?: Date;

  @ApiProperty({ description: '培训地点', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: '报名截止时间', required: false })
  @IsDate()
  @IsOptional()
  enrollmentDeadline?: Date;

  @ApiProperty({ description: '最大参训人数', required: false })
  @IsNumber()
  @IsOptional()
  maxParticipants?: number;
}