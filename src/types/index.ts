// 因为 SQLite 不支持 Prisma enum，这里在应用层统一定义状态与角色的 string literal
// 保证数据库存 String、前端/API 全部走同一套字面量类型，口径一致

export type OrderStatus =
  | "RECEIVED"
  | "DETECTED"
  | "BARGAIN_REVIEW"
  | "BARGAIN_APPROVED"
  | "BARGAIN_REJECTED"
  | "PAYMENT_REQUESTED"
  | "PAYMENT_PAID"
  | "PAYMENT_RETURNED"
  | "CLOSED";

export type Role = "RECEIVER" | "DETECTER" | "FINANCE";

export const OrderStatusList: OrderStatus[] = [
  "RECEIVED",
  "DETECTED",
  "BARGAIN_REVIEW",
  "BARGAIN_APPROVED",
  "BARGAIN_REJECTED",
  "PAYMENT_REQUESTED",
  "PAYMENT_PAID",
  "PAYMENT_RETURNED",
  "CLOSED",
];

export const RoleList: Role[] = ["RECEIVER", "DETECTER", "FINANCE"];
