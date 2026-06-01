import { IsString, IsInt, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrescriptionStatus } from './prescription.enum';

export class MedicineDto {
  @ApiProperty({ description: '药品名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '规格' })
  @IsString()
  @IsNotEmpty()
  specification: string;

  @ApiProperty({ description: '剂量' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ description: '用法频率' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ description: '数量' })
  @IsInt()
  quantity: number;

  @ApiProperty({ description: '单位' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ description: '处方编号' })
  @IsString()
  @IsNotEmpty()
  prescriptionNo: string;

  @ApiProperty({ description: '患者姓名' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: '患者年龄' })
  @IsInt()
  patientAge: number;

  @ApiProperty({ description: '患者性别', enum: ['男', '女', '未知'] })
  @IsString()
  @IsNotEmpty()
  patientGender: string;

  @ApiProperty({ description: '开具医生姓名' })
  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @ApiProperty({ description: '科室' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: '诊断' })
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiProperty({ description: '药品列表', type: [MedicineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineDto)
  medicines: MedicineDto[];

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({ description: '门店ID' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: '门店名称' })
  @IsString()
  @IsNotEmpty()
  storeName: string;
}

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ description: '患者姓名' })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiPropertyOptional({ description: '患者年龄' })
  @IsInt()
  @IsOptional()
  patientAge?: number;

  @ApiPropertyOptional({ description: '患者性别', enum: ['男', '女', '未知'] })
  @IsString()
  @IsOptional()
  patientGender?: string;

  @ApiPropertyOptional({ description: '开具医生姓名' })
  @IsString()
  @IsOptional()
  doctorName?: string;

  @ApiPropertyOptional({ description: '科室' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '诊断' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ description: '药品列表', type: [MedicineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineDto)
  @IsOptional()
  medicines?: MedicineDto[];

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class SubmitPrescriptionDto {
  @ApiPropertyOptional({ description: '提交备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class ReviewPrescriptionDto {
  @ApiPropertyOptional({ description: '审核备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class ApprovePrescriptionDto {
  @ApiPropertyOptional({ description: '审核通过备注' })
  @IsString()
  @IsOptional()
  reviewRemark?: string;
}

export class RejectPrescriptionDto {
  @ApiProperty({ description: '拒绝原因' })
  @IsString()
  @IsNotEmpty()
  rejectReason: string;

  @ApiPropertyOptional({ description: '审核备注' })
  @IsString()
  @IsOptional()
  reviewRemark?: string;
}

export class SupplementPrescriptionDto {
  @ApiProperty({ description: '补充说明' })
  @IsString()
  @IsNotEmpty()
  supplementRemark: string;
}

export class VoidPrescriptionDto {
  @ApiProperty({ description: '作废原因' })
  @IsString()
  @IsNotEmpty()
  remark: string;
}

export class PrescriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '处方状态', enum: PrescriptionStatus })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  currentStatus?: PrescriptionStatus;

  @ApiPropertyOptional({ description: '门店ID' })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: '患者姓名' })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '处方编号' })
  @IsString()
  @IsOptional()
  prescriptionNo?: string;
}
