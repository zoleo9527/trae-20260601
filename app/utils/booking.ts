import type { BookingStatus, DepositStatus } from "@prisma/client";

export const statusLabels: Record<BookingStatus, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CHECKED_IN: "已入场",
  IN_SERVICE: "服务中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  RESCHEDULED: "已改期",
  REJECTED: "已驳回",
};

export const depositStatusLabels: Record<DepositStatus, string> = {
  PENDING: "待核验",
  VERIFIED: "已核验",
  REFUNDED: "已退还",
  CONFISCATED: "已没收",
};

export const roleLabels: Record<string, string> = {
  ADMIN: "管理员",
  RECEPTIONIST: "前台",
  FLOOR_SUPERVISOR: "楼层主管",
  FINANCE: "财务",
};
