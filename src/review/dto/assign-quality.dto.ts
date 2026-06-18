import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class AssignQualityDto {
  @ApiProperty({ description: '分配角色', enum: Role, example: Role.QUALITY_SUPERVISOR })
  @IsEnum(Role)
  @IsNotEmpty()
  assignedRole: Role;

  @ApiProperty({ description: '分配人ID', example: 'uuid-xxx-xxx' })
  @IsString()
  @IsNotEmpty()
  assignedId: string;

  @ApiProperty({ description: '分配人姓名', example: '李主管' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignedName: string;

  @ApiProperty({ description: '截止时间小时数', example: 24, required: false, default: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  deadlineHours?: number = 24;
}
