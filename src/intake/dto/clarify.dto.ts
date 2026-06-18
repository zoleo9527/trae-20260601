import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class ClarifyDto {
  @ApiPropertyOptional({ description: '服务内容描述(客户澄清后填写)', example: '每周两次，每次4小时' })
  @IsString()
  @IsOptional()
  serviceScope?: string;

  @ApiProperty({ description: '客服备注', example: '已电话确认服务内容' })
  @IsString()
  @IsNotEmpty()
  clarificationNotes: string;

  @ApiProperty({
    description: '操作人角色',
    enum: Role,
    example: Role.CUSTOMER_SERVICE,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  actorRole: Role;

  @ApiProperty({ description: '操作人ID', example: 'uuid-xxx-xxx' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  actorId: string;

  @ApiProperty({ description: '操作人姓名', example: '李客服' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  actorName: string;
}
