import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

export function formatDate(date: string, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string, format = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format)
}

export function isDelayed(endDate: string): boolean {
  return dayjs().isAfter(endDate, 'day')
}

export function getDaysBetween(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'day')
}

export function getProgressDays(startDate: string): number {
  return dayjs().diff(dayjs(startDate), 'day')
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return dayjs(date).isBetween(start, end, 'day', '[]')
}

export function getRelativeTime(date: string): string {
  const now = dayjs()
  const target = dayjs(date)
  const diffDays = now.diff(target, 'day')
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  } else {
    return formatDate(date)
  }
}

export function calculateProgress(startDate: string, endDate: string): number {
  const total = getDaysBetween(startDate, endDate)
  const elapsed = getProgressDays(startDate)
  
  if (total <= 0) return 100
  if (elapsed <= 0) return 0
  if (elapsed >= total) return 100
  
  return Math.round((elapsed / total) * 100)
}
