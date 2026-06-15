import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddTaskSupplementDto {
  @ApiProperty({ description: '补充备注内容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
