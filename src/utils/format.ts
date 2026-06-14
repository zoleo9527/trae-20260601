import dayjs from 'dayjs';

export function formatDateTime(dateTime: string | Date): string {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(dateTime: string | Date): string {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('YYYY-MM-DD');
}

export function formatTime(dateTime: string | Date): string {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('HH:mm:ss');
}

export function formatRelativeTime(dateTime: string | Date): string {
  if (!dateTime) return '-';
  const now = dayjs();
  const target = dayjs(dateTime);
  const diffMinutes = now.diff(target, 'minute');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
  if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}天前`;
  return formatDate(dateTime);
}

export function formatCurrency(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return `¥${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatTaskNo(taskNo: string): string {
  if (!taskNo) return '-';
  return taskNo;
}

export function getCurrentTime(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function getCurrentDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getTimeRange(days: number): { start: string; end: string } {
  const end = dayjs();
  const start = end.subtract(days, 'day');
  return {
    start: start.format('YYYY-MM-DD HH:mm:ss'),
    end: end.format('YYYY-MM-DD HH:mm:ss')
  };
}
