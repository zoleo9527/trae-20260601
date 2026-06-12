import { IsNotEmpty, IsString, IsDecimal } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  orderNo: string;

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsString()
  productName: string;

  @IsNotEmpty()
  @IsDecimal()
  quantity: number;
}