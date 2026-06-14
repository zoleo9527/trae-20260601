import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(dateString: string, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    return format(parseISO(dateString), formatStr, { locale: zhCN });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return dateString;
  }
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name.charAt(0);
}
