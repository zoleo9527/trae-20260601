import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Role } from "../../common/enums";

export enum NoShowParty {
  HOUSEKEEPER = "HOUSEKEEPER",
  CUSTOMER = "CUSTOMER",
}

export class ReportNoShowDto {
  @ApiProperty({ description: "爽约方", enum: NoShowParty })
  @IsNotEmpty()
  @IsEnum(NoShowParty)
  noShowParty: NoShowParty;

  @ApiProperty({ description: "爽约原因描述" })
  @IsNotEmpty()
  @IsString()
  noShowReason: string;

  @ApiPropertyOptional({ description: "处理责任人角色", enum: Role, default: Role.CUSTOMER_SERVICE })
  @IsOptional()
  @IsEnum(Role)
  handlerRole?: Role = Role.CUSTOMER_SERVICE;

  @ApiPropertyOptional({ description: "处理责任人ID" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  handlerId?: string;

  @ApiPropertyOptional({ description: "处理责任人姓名" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  handlerName?: string;
}
