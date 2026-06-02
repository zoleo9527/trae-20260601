import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeMs(timeStr: string): number {
  return new Date(timeStr).getTime();
}

export function getDateFromTimeStr(timeStr: string): Date {
  return new Date(timeStr);
}

export function isToday(timeStr: string): boolean {
  const recordDate = getDateFromTimeStr(timeStr);
  const today = new Date();
  return getLocalDateStr(recordDate) === getLocalDateStr(today);
}

export function sortByTimeAsc<T extends { time?: string; timestamp?: string }>(
  items: T[],
  timeKey: 'time' | 'timestamp' = 'time'
): T[] {
  return [...items].sort((a, b) => {
    const timeA = getTimeMs((a[timeKey] as string) || '');
    const timeB = getTimeMs((b[timeKey] as string) || '');
    return timeA - timeB;
  });
}

export function sortByTimeDesc<T extends { time?: string; timestamp?: string }>(
  items: T[],
  timeKey: 'time' | 'timestamp' = 'time'
): T[] {
  return [...items].sort((a, b) => {
    const timeA = getTimeMs((a[timeKey] as string) || '');
    const timeB = getTimeMs((b[timeKey] as string) || '');
    return timeB - timeA;
  });
}

export function formatTimeHHMM(timeStr: string): string {
  const date = getDateFromTimeStr(timeStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
