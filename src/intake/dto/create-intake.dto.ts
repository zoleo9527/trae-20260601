import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriorityLevel } from '../../common/enums/priority-level.enum';

class AppearanceCheckDto {
  @ApiProperty()
  @IsBoolean()
  hasScreenDamage: boolean;

  @ApiProperty()
  @IsBoolean()
  hasBackDamage: boolean;

  @ApiProperty()
  @IsBoolean()
  hasFrameDamage: boolean;

  @ApiProperty()
  @IsBoolean()
  hasWaterDamage: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes: string;
}

export class CreateIntakeDto {
  @ApiProperty({ description: '客户姓名' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: '客户手机号' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerWechat: string;

  @ApiProperty({ description: '手机品牌' })
  @IsString()
  @IsNotEmpty()
  phoneBrand: string;

  @ApiProperty({ description: '手机型号' })
  @IsString()
  @IsNotEmpty()
  phoneModel: string;

  @ApiProperty({ description: '手机颜色' })
  @IsString()
  @IsNotEmpty()
  phoneColor: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneImei: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phonePassword: string;

  @ApiProperty({ description: '故障描述' })
  @IsString()
  @IsNotEmpty()
  faultDescription: string;

  @ApiPropertyOptional({ type: AppearanceCheckDto })
  @ValidateNested()
  @Type(() => AppearanceCheckDto)
  @IsOptional()
  appearanceCheck: AppearanceCheckDto;

  @ApiPropertyOptional({ type: [String], description: '随机配件' })
  @IsArray()
  @IsOptional()
  accessories: string[];

  @ApiPropertyOptional({ description: '预估价格' })
  @IsNumber()
  @IsOptional()
  estimatedPrice: number;

  @ApiPropertyOptional({ description: '定金' })
  @IsNumber()
  @IsOptional()
  deposit: number;

  @ApiPropertyOptional({ enum: PriorityLevel, default: PriorityLevel.NORMAL })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority: PriorityLevel;

  @ApiPropertyOptional({ description: '维修师ID（可选，预分配）' })
  @IsString()
  @IsOptional()
  technicianId: string;
}
