import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeMs(timeStr: string): number {
  return new Date(timeStr).getTime();
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
  const date = new Date(timeStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function isToday(timeStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return timeStr.startsWith(today);
}
