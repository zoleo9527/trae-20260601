import { IsEnum, IsOptional, IsObject, IsString, IsNotEmpty } from 'class-validator';

export class CreateExportTaskDto {
  @IsEnum(['LEAVE', 'MAKEUP'], { message: '导出类型必须是 LEAVE 或 MAKEUP' })
  type: 'LEAVE' | 'MAKEUP';

  @IsEnum(['CSV', 'EXCEL'], { message: '格式必须是 CSV 或 EXCEL' })
  format: 'CSV' | 'EXCEL';

  @IsObject()
  @IsOptional()
  filters: Record<string, any>;

  @IsString()
  @IsNotEmpty({ message: '幂等键不能为空' })
  idempotencyKey: string;
}

export class QueryExportListDto {
  @IsOptional()
  @IsEnum(['LEAVE', 'MAKEUP'])
  type?: 'LEAVE' | 'MAKEUP';

  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
  status?: string;
}
