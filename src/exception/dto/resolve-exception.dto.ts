
import { IsString, IsOptional } from 'class-validator';

export class ResolveExceptionDto {
  @IsString()
  @IsOptional()
  resolveComment?: string;
}
