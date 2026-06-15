export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function calculateOverdueDays(expectedEndDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(expectedEndDate);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - endDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatStuckHours(hours: number): string {
  if (hours < 24) {
    return `${hours}小时`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days}天`;
  }
  return `${days}天${remainingHours}小时`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function calculateOverdueInfo(
  contractStatus: string,
  expectedEndDate: string,
  dailyRate: number,
  contractOverdueDays?: number
): {
  isOverdue: boolean;
  overdueDays: number;
  daysLeft: number;
  overdueFee: number;
} {
  const today = getTodayDate();
  const endDate = parseDate(expectedEndDate);
  
  const diffTime = today.getTime() - endDate.getTime();
  const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdueByDate = calculatedDays > 0;
  const isOverdueByStatus = contractStatus === 'overdue';
  
  const isOverdue = isOverdueByDate || isOverdueByStatus;
  
  let overdueDays = 0;
  if (isOverdue) {
    if (contractOverdueDays && contractOverdueDays > calculatedDays) {
      overdueDays = contractOverdueDays;
    } else {
      overdueDays = Math.max(0, calculatedDays);
    }
  }
  
  const daysLeft = isOverdue ? -overdueDays : Math.max(0, -calculatedDays);
  const overdueFee = overdueDays * dailyRate * 1.5;
  
  return {
    isOverdue,
    overdueDays,
    daysLeft,
    overdueFee,
  };
}
