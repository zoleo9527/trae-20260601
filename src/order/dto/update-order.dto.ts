import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from "class-validator";
import { CreateOrderDto } from "./create-order.dto";
import { OrderStatus } from "../../common/enums/order-status.enum";
import { Role } from "../../common/enums";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ description: "订单状态", enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: "爽约原因描述" })
  @IsOptional()
  @IsString()
  noShowReason?: string;

  @ApiPropertyOptional({ description: "爽约处理责任人角色", enum: Role })
  @IsOptional()
  @IsEnum(Role)
  noShowHandlerRole?: Role;

  @ApiPropertyOptional({ description: "爽约处理责任人ID" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noShowHandlerId?: string;

  @ApiPropertyOptional({ description: "爽约处理责任人姓名" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noShowHandlerName?: string;

  @ApiPropertyOptional({ description: "处理方案" })
  @IsOptional()
  @IsString()
  noShowResolution?: string;

  @ApiPropertyOptional({ description: "服务内容争议状态", enum: ["PENDING", "CLARIFIED", "IN_DISPUTE"] })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  serviceClarificationStatus?: string;

  @ApiPropertyOptional({ description: "与客户联系澄清次数" })
  @IsOptional()
  @IsInt()
  clarificationContactCount?: number;

  @ApiPropertyOptional({ description: "纠纷发起时间" })
  @IsOptional()
  @IsDateString()
  disputeOpenedAt?: Date;

  @ApiPropertyOptional({ description: "纠纷解决时间" })
  @IsOptional()
  @IsDateString()
  disputeResolvedAt?: Date;
}
