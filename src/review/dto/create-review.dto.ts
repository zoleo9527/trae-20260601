import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '订单ID', example: 'uuid-xxx-xxx' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: '客户姓名', example: '张三' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: '家政员ID', example: 'uuid-xxx-xxx' })
  @IsUUID()
  @IsNotEmpty()
  housekeeperId: string;

  @ApiProperty({ description: '评分(1-5)', example: 2, minimum: 1, maximum: 5 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '差评内容', example: '家政员迟到且服务不认真' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
