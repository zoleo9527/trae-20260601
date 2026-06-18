
import { IsString, IsNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class CreateRecruitmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsNotEmpty()
  requirements: string[];

  @IsInt()
  @Min(1)
  quota: number;
}
