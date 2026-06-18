import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FollowUpDto {
  @ApiProperty({ description: '跟进记录', example: '已联系客户，正在协调解决方案' })
  @IsString()
  @IsNotEmpty()
  followUpNotes: string;
}
