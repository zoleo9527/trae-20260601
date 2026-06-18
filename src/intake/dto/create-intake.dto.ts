import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateIntakeDto {
  @ApiProperty({ description: '客户姓名', example: '张三' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: '客户电话', example: '13800138000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customerPhone: string;

  @ApiProperty({ description: '服务地址', example: '北京市朝阳区xxx路xxx号' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: '服务类型', example: '日常保洁' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  serviceType: string;

  @ApiPropertyOptional({ description: '服务内容描述', example: '每周两次，每次4小时' })
  @IsString()
  @IsOptional()
  serviceScope?: string;

  @ApiProperty({ description: '薪资预算(元/月)', example: 6000 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  salaryBudget: number;

  @ApiProperty({ description: '期望开始时间', example: '2026-07-01' })
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiPropertyOptional({ description: '每周需要天数', example: 5 })
  @IsInt()
  @IsOptional()
  @Min(1)
  requiredDaysPerWeek?: number;

  @ApiPropertyOptional({ description: '每天需要小时数', example: 4 })
  @IsInt()
  @IsOptional()
  @Min(1)
  hoursPerDay?: number;

  @ApiPropertyOptional({ description: '特殊要求', example: '需要有育儿经验' })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiPropertyOptional({ description: '备注', example: '客户偏好东北阿姨' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
