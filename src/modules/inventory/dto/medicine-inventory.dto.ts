import { IsString, IsNumber, IsDate, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateMedicineInventoryDto {
  @IsString()
  @IsNotEmpty()
  medicineCode: string;

  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @IsString()
  @IsNotEmpty()
  specification: string;

  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  expiryDate: Date;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastCountTime?: Date;
}

export class UpdateMedicineInventoryDto {
  @IsOptional()
  @IsString()
  medicineName?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastCountTime?: Date;
}

export class MedicineInventoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  medicineName?: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDateStart?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDateEnd?: Date;

  @IsOptional()
  @IsString()
  storeId?: string;
}
