import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
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
}
