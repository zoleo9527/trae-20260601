import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class ClarifyServiceDto {
  @ApiProperty({ description: "订单ID" })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: "服务内容澄清" })
  @IsOptional()
  @IsString()
  serviceScope?: string;

  @ApiPropertyOptional({ description: "是否增加联系次数", default: true })
  @IsOptional()
  @IsBoolean()
  contactCountIncrement?: boolean = true;

  @ApiPropertyOptional({ description: "备注说明" })
  @IsOptional()
  @IsString()
  notes?: string;
}
