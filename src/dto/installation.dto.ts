import { IsString, IsOptional, IsDate, IsNumber, IsEnum, IsUUID, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { InstallationStatus, PaymentStatus } from '../entities/installation.entity';

export class CreateInstallationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsDefined()
  @IsString()
  customerName: string;

  @IsDefined()
  @IsString()
  customerPhone: string;

  @IsDefined()
  @IsString()
  address: string;

  @IsDefined()
  @IsString()
  productType: string;

  @IsOptional()
  @IsString()
  productModel?: string;

  @IsOptional()
  @IsString()
  productSerialNo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDate()
  scheduledDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInstallationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  productModel?: string;

  @IsOptional()
  @IsString()
  productSerialNo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(InstallationStatus)
  status?: InstallationStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDate()
  scheduledDate?: Date;

  @IsOptional()
  @IsDate()
  actualDate?: Date;

  @IsOptional()
  @IsUUID()
  installerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class InstallationQueryDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsEnum(InstallationStatus)
  status?: InstallationStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsUUID()
  installerId?: string;

  @IsOptional()
  @IsUUID()
  dispatcherId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}