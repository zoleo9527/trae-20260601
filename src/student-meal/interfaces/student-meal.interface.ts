import { MealType, OrderStatus } from '../../common/enums';
import { OperationTimeline } from '../../common/interfaces';
import { SpecialMealTag, SpecialTagLog } from '../../special-meal/interfaces/special-meal.interface';

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

export interface OrderDetailAggregate {
  order: StudentMealOrder;
  timeline: OperationTimeline[];
  studentCurrentTags: SpecialMealTag[];
  recentTagLogs: SpecialTagLog[];
  specialMealReviewPath: string;
  orderDetailPath: string;
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
