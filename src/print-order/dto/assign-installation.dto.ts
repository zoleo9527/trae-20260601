import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray } from 'class-validator';

export class AssignInstallationDto {
  @ApiProperty({ description: '安装队长ID' })
  @IsString()
  @IsNotEmpty()
  installLeaderId: string;

  @ApiPropertyOptional({ description: '安装时间' })
  @IsOptional()
  @IsDateString()
  installTime?: string;

  @ApiPropertyOptional({ description: '安装地址' })
  @IsOptional()
  @IsString()
  installAddress?: string;

  @ApiPropertyOptional({ description: '派工备注' })
  @IsOptional()
  @IsString()
  assignmentNotes?: string;

  @ApiPropertyOptional({ description: '队员名单' })
  @IsOptional()
  @IsArray()
  teamMembers?: string[];
}
