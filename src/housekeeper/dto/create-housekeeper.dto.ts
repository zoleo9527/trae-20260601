import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { HousekeeperStatus } from '../../common/enums';

export class CreateHousekeeperDto {
  @ApiProperty({ description: '姓名', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '手机号', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: '身份证号', maxLength: 18 })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  idCard?: string;

  @ApiPropertyOptional({ description: '年龄' })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({ description: '性别', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @ApiPropertyOptional({ description: '状态', enum: HousekeeperStatus, default: HousekeeperStatus.ACTIVE })
  @IsOptional()
  status?: HousekeeperStatus;

  @ApiProperty({ description: '技能，逗号分隔: 保洁,育儿,老人,烹饪,月嫂' })
  @IsString()
  @IsNotEmpty()
  skills: string;

  @ApiPropertyOptional({ description: '工作经验年数', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ description: '覆盖区域，逗号分隔', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  coverageArea?: string;

  @ApiPropertyOptional({ description: '期望最低月薪', default: 4000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedMinSalary?: number;

  @ApiPropertyOptional({ description: '可开始工作日期' })
  @IsOptional()
  @IsDateString()
  availableFrom?: Date;

  @ApiPropertyOptional({ description: '每周可工作天数，例: "周一,周三,周五"' })
  @IsOptional()
  @IsString()
  weeklyAvailableDays?: string;

  @ApiPropertyOptional({ description: '是否已做无犯罪记录检查', default: false })
  @IsOptional()
  @IsBoolean()
  hasCriminalRecordCheck?: boolean;

  @ApiPropertyOptional({ description: '是否有健康证', default: false })
  @IsOptional()
  @IsBoolean()
  hasHealthCertificate?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
