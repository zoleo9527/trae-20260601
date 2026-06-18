import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { Role } from "../../common/enums";

export class CreateOrderDto {
  @ApiPropertyOptional({ description: "关联客户需求ID" })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiProperty({ description: "阿姨ID" })
  @IsNotEmpty()
  @IsUUID()
  housekeeperId: string;

  @ApiProperty({ description: "客户姓名" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: "客户电话" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @ApiProperty({ description: "服务地址" })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: "服务类型" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  serviceType: string;

  @ApiPropertyOptional({ description: "订单级服务内容澄清" })
  @IsOptional()
  @IsString()
  serviceScope?: string;

  @ApiProperty({ description: "排班开始时间" })
  @IsNotEmpty()
  @IsDateString()
  scheduledStart: Date;

  @ApiPropertyOptional({ description: "排班结束时间" })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: Date;

  @ApiProperty({ description: "订单金额/月(分)" })
  @IsNotEmpty()
  @IsInt()
  salaryAmount: number;

  @ApiPropertyOptional({ description: "责任人角色" })
  @IsOptional()
  ownerRole?: Role;

  @ApiPropertyOptional({ description: "责任人ID" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerId?: string;

  @ApiPropertyOptional({ description: "责任人姓名" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerName?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  remarks?: string;
}
