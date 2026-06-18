import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Role } from "../../common/enums";

export enum NoShowResolutionType {
  QUALITY_REVIEW = "QUALITY_REVIEW",
  REMATCH = "REMATCH",
  CANCEL = "CANCEL",
}

export class HandleNoShowDto {
  @ApiProperty({ description: "处理方案类型", enum: NoShowResolutionType })
  @IsNotEmpty()
  @IsEnum(NoShowResolutionType)
  resolutionType: NoShowResolutionType;

  @ApiProperty({ description: "处理方案详情描述" })
  @IsNotEmpty()
  @IsString()
  resolution: string;

  @ApiPropertyOptional({ description: "分配责任人角色", enum: Role })
  @IsOptional()
  @IsEnum(Role)
  assignOwnerRole?: Role;

  @ApiPropertyOptional({ description: "分配责任人ID" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignOwnerId?: string;

  @ApiPropertyOptional({ description: "分配责任人姓名" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignOwnerName?: string;
}
