import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '关联客户需求ID' })
  @IsOptional()
  @IsUUID()
  intakeId?: string;

  @ApiPropertyOptional({ description: '阿姨ID' })
  @IsOptional()
  @IsUUID()
  housekeeperId?: string;
}
