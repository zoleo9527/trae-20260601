import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class SubmitAcceptanceDto {
  @IsUUID()
  installationId: string;

  @IsBoolean()
  isAccepted: boolean;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class VerifyAcceptanceDto {
  @IsUUID()
  installationId: string;

  @IsBoolean()
  isVerified: boolean;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}