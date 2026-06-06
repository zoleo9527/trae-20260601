import { format, parseISO, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: zhCN });
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  return differenceInMinutes(end, start);
};

export const now = (): string => {
  return new Date().toISOString();
};
