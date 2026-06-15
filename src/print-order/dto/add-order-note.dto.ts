import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { NoteType } from '../entities/order-note.entity';

export class AddOrderNoteDto {
  @ApiProperty({ description: '备注内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '备注类型', enum: NoteType })
  @IsOptional()
  @IsEnum(NoteType)
  noteType?: NoteType;

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  metadata?: Record<string, any>;
}
