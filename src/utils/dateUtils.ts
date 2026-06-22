export function calculateDueDate(outboundDate: Date, paymentTermDays: number): Date {
  const dueDate = new Date(outboundDate);
  dueDate.setDate(dueDate.getDate() + paymentTermDays);
  return dueDate;
}

export function calculateDaysBetween(from: Date, to: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  return Math.floor((toMs - fromMs) / oneDay);
}

export function calculateAgeDays(outboundDate: Date): number {
  return calculateDaysBetween(outboundDate, new Date());
}

export function calculateOverdueDays(dueDate: Date): number {
  const today = new Date();
  const overdue = calculateDaysBetween(dueDate, today);
  return overdue > 0 ? overdue : 0;
}

export function getAgingBucket(overdueDays: number): string {
  if (overdueDays <= 0) return "CURRENT";
  if (overdueDays <= 30) return "1-30天";
  if (overdueDays <= 60) return "31-60天";
  if (overdueDays <= 90) return "61-90天";
  if (overdueDays <= 180) return "91-180天";
  return "180天以上";
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function generateOrderNo(prefix: string, id: number): string {
  const dateStr = formatDate(new Date()).replace(/-/g, "");
  return `${prefix}${dateStr}${String(id).padStart(4, "0")}`;
}
