import { MealType, OrderStatus } from '../../common/enums';

export interface StudentMealOrder {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  status: OrderStatus;
  mealType: MealType;
  specialDietTag?: string[];
  remark?: string;
  createTime: Date;
  updateTime: Date;
  createBy: string;
  createByName: string;
}

export interface CreateOrderDto {
  date: string;
  studentId: string;
  mealType: MealType;
  specialDietTag?: string[];
  remark?: string;
}

export interface BatchCreateOrderDto {
  date: string;
  orders: Array<{
    studentId: string;
    mealType: MealType;
    specialDietTag?: string[];
    remark?: string;
  }>;
}

export interface BatchConfirmOrderDto {
  orderIds: string[];
}
