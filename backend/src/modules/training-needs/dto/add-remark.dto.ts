import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddRemarkDto {
  @ApiProperty({ description: '备注内容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}