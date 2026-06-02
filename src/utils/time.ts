import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'MM-dd')
}

export function fmtTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), 'MM-dd HH:mm')
}

export function fmtFull(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
}

export function fmtRelative(iso: string): string {
  const d = parseISO(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}天前`
  return fmtDateTime(iso)
}

export function getWeekDays(baseDate?: Date): Date[] {
  const base = baseDate || new Date()
  const start = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getHourRange(startIso: string, endIso: string): string {
  return `${fmtTime(startIso)}-${fmtTime(endIso)}`
}

export function getDayLabel(date: Date): string {
  return format(date, 'EEEE', { locale: zhCN })
}

export function getShortDate(date: Date): string {
  return format(date, 'M/d')
}

export function isSameDay(iso1: string, date2: Date): boolean {
  const d1 = parseISO(iso1)
  return d1.getFullYear() === date2.getFullYear() &&
    d1.getMonth() === date2.getMonth() &&
    d1.getDate() === date2.getDate()
}

export function isTimeInRange(iso: string, day: Date, hour: number): boolean {
  const d = parseISO(iso)
  return isSameDay(iso, day) && d.getHours() <= hour && d.getHours() + (d.getMinutes() > 0 ? 1 : 0) > hour
}

export function getHourFromIso(iso: string): number {
  return parseISO(iso).getHours()
}
