import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd', { locale: zhCN });
  } catch {
    return iso;
  }
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'HH:mm:ss', { locale: zhCN });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: zhCN });
  } catch {
    return iso;
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
