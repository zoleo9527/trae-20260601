import { IsString, IsEnum, IsInt, IsOptional, IsDate, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { AlertLevel, AlertStatus } from '../entities/near-expiry-alert.entity';

export class NearExpiryAlertQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AlertLevel)
  alertLevel?: AlertLevel;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minDaysToExpiry?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxDaysToExpiry?: number;

  @IsOptional()
  @IsString()
  storeId?: string;
}

export class AcknowledgeAlertDto {
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ResolveAlertDto {
  @IsOptional()
  @IsString()
  remark?: string;
}

export class NearExpiryMedicineQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  daysToExpiry?: number = 90;
}
