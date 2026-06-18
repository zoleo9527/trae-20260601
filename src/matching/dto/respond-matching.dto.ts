import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '../../common/enums';

export class RespondMatchingDto {
  @ApiProperty({ description: '匹配尝试ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({ description: '是否接受' })
  @IsBoolean()
  @IsNotEmpty()
  accept: boolean;

  @ApiPropertyOptional({ description: '拒绝理由备注' })
  @IsOptional()
  @IsString()
  rejectionNotes?: string;

  @ApiProperty({ description: '操作人角色', enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  actorRole: Role;

  @ApiProperty({ description: '操作人ID' })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiProperty({ description: '操作人姓名' })
  @IsString()
  @IsNotEmpty()
  actorName: string;
}
