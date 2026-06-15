import { IsString, IsOptional, IsDate, IsNumber, IsEnum, IsUUID } from 'class-validator';
import { InstallationStatus, PaymentStatus } from '../entities/installation.entity';

export class CreateInstallationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsString()
  address: string;

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
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}