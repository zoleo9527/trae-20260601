import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString, IsDate } from 'class-validator';
import { CourseProjectStatus } from '../../entities/course-project.entity';

export class CourseProjectQueryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  pageSize?: number = 10;

  @ApiProperty({ description: '状态', enum: CourseProjectStatus, required: false })
  @IsEnum(CourseProjectStatus)
  @IsOptional()
  status?: CourseProjectStatus;

  @ApiProperty({ description: '讲师ID', required: false })
  @IsString()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ description: '关键词（标题/描述）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;
}