import type { OrderStatus, Role } from "@/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "收货入库",
  DETECTED: "检测完成",
  BARGAIN_REVIEW: "议价复核",
  BARGAIN_APPROVED: "议价通过",
  BARGAIN_REJECTED: "议价驳回",
  PAYMENT_REQUESTED: "打款申请",
  PAYMENT_PAID: "打款完成",
  PAYMENT_RETURNED: "打款退回",
  CLOSED: "已关闭",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  RECEIVED: "bg-slate-100 text-slate-700 border-slate-300",
  DETECTED: "bg-sky-50 text-sky-700 border-sky-300",
  BARGAIN_REVIEW: "bg-amber-50 text-amber-700 border-amber-300",
  BARGAIN_APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  BARGAIN_REJECTED: "bg-rose-50 text-rose-700 border-rose-300",
  PAYMENT_REQUESTED: "bg-violet-50 text-violet-700 border-violet-300",
  PAYMENT_PAID: "bg-green-50 text-green-700 border-green-300",
  PAYMENT_RETURNED: "bg-orange-50 text-orange-700 border-orange-300",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-300",
};

export const ROLE_LABEL: Record<Role, string> = {
  RECEIVER: "收货员",
  DETECTER: "检测师",
  FINANCE: "财务",
};

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ["DETECTED", "CLOSED"],
  DETECTED: ["BARGAIN_REVIEW", "BARGAIN_APPROVED", "CLOSED"],
  BARGAIN_REVIEW: ["BARGAIN_APPROVED", "BARGAIN_REJECTED", "DETECTED"],
  BARGAIN_APPROVED: ["PAYMENT_REQUESTED", "BARGAIN_REVIEW", "CLOSED"],
  BARGAIN_REJECTED: ["DETECTED", "CLOSED"],
  PAYMENT_REQUESTED: ["PAYMENT_PAID", "PAYMENT_RETURNED"],
  PAYMENT_PAID: ["CLOSED"],
  PAYMENT_RETURNED: ["BARGAIN_REVIEW", "PAYMENT_REQUESTED", "CLOSED"],
  CLOSED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function fmtMoney(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return `¥${num.toFixed(2)}`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
