import { IsString, IsOptional, IsEnum, IsDefined } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsDefined()
  @IsString()
  username: string;

  @IsDefined()
  @IsString()
  password: string;

  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;
}