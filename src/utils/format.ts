import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd');
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd HH:mm');
}

export function formatRelativeTime(dateStr: string, endDateStr?: string): string {
  if (endDateStr) {
    return formatDistanceToNow(parseISO(endDateStr), { 
      addSuffix: false, 
      locale: zhCN 
    });
  }
  return formatDistanceToNow(parseISO(dateStr), { 
    addSuffix: true, 
    locale: zhCN 
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
