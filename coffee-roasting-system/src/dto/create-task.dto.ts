import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { TaskType } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsEnum(TaskType)
  type: TaskType;

  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  batchNo?: string;
}
