import { z } from 'zod';

export const StaffRole = z.enum(['reservation_staff', 'bar_staff', 'manager']);
export type StaffRole = z.infer<typeof StaffRole>;

export const ReservationStatus = z.enum([
  'pending',        // 待处理
  'confirmed',      // 已确认
  'in_progress',    // 进行中
  'completed',      // 已完成
  'cancelled',      // 已取消
  'returned'         // 已退回
]);
export type ReservationStatus = z.infer<typeof ReservationStatus>;

export const MinimumConsumptionStatus = z.enum([
  'pending',        // 待确认
  'confirmed',      // 已确认
  'rejected',       // 已拒绝
  'modified'        // 已修改
]);
export type MinimumConsumptionStatus = z.infer<typeof MinimumConsumptionStatus>;

export const BeverageStorageStatus = z.enum([
  'stored',         // 已寄存
  'retrieved',      // 已取回
  'expired',        // 已过期
  'unclear'          // 说不清
]);
export type BeverageStorageStatus = z.infer<typeof BeverageStorageStatus>;

export const SingerScheduleStatus = z.enum([
  'scheduled',      // 已排班
  'confirmed',      // 已确认
  'rescheduled',    // 已改期
  'cancelled'       // 已取消
]);
export type SingerScheduleStatus = z.infer<typeof SingerScheduleStatus>;

export const Priority = z.enum(['low', 'medium', 'high', 'urgent']);
export type Priority = z.infer<typeof Priority>;

export const IssueType = z.enum([
  'duplicate_reservation',   // 订台重复
  'beverage_unclear',        // 寄存酒说不清
  'schedule_conflict',       // 演出冲突
  'minimum_consumption_pending', // 低消待确认
  'notes_incomplete'          // 备注不完整
]);
export type IssueType = z.infer<typeof IssueType>;
