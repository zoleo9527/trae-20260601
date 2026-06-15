import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ConsentItemsDto {
  @ApiProperty({ description: '是否同意访问手机数据' })
  @IsBoolean()
  allowDataAccess: boolean;

  @ApiProperty({ description: '是否同意拍照存档' })
  @IsBoolean()
  allowPhotoBackup: boolean;

  @ApiProperty({ description: '是否同意维修期间联系' })
  @IsBoolean()
  allowContactRepair: boolean;

  @ApiProperty({ description: '是否同意披露维修信息（保险等第三方）' })
  @IsBoolean()
  allowDisclosure: boolean;
}

export class SignConsentDto {
  @ApiProperty({ description: '客户签名（base64或手写签名数据）' })
  @IsString()
  @IsNotEmpty()
  customerSignature: string;

  @ApiProperty({ description: '客户姓名（再次确认）' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ type: ConsentItemsDto })
  @ValidateNested()
  @Type(() => ConsentItemsDto)
  consentItems: ConsentItemsDto;

  @ApiPropertyOptional({ description: '客户手机号校验' })
  @IsString()
  @IsOptional()
  customerPhone?: string;
}
