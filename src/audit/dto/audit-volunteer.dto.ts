
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AuditVolunteerDto {
  @IsString()
  @IsNotEmpty()
  decision: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  comment?: string;
}
