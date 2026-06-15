import { IsString, IsOptional, IsBoolean, IsUUID, IsDefined } from 'class-validator';

export class SubmitAcceptanceDto {
  @IsDefined()
  @IsUUID()
  installationId: string;

  @IsDefined()
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
  @IsDefined()
  @IsUUID()
  installationId: string;

  @IsDefined()
  @IsBoolean()
  isVerified: boolean;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}