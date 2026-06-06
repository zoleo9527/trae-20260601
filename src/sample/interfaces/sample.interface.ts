import { SampleMealType } from '../../common/enums';

export interface SampleRecord {
  id: string;
  date: string;
  mealType: SampleMealType;
  dishes: string[];
  specialDishes?: string[];
  sampleTime: Date;
  operatorId: string;
  operatorName: string;
  expireTime: Date;
  storageLocation: string;
  remark?: string;
  createTime: Date;
}

export interface CreateSampleDto {
  date: string;
  mealType: SampleMealType;
  dishes: string[];
  specialDishes?: string[];
  storageLocation: string;
  remark?: string;
}
