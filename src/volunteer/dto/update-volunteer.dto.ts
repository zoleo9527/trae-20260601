
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { VolunteerStatus } from '@prisma/client';

export class UpdateVolunteerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsEnum(VolunteerStatus)
  @IsOptional()
  status?: VolunteerStatus;
}
