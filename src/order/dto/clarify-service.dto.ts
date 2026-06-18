import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ClarifyServiceDto {
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
