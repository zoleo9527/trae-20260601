import { format, formatDistanceToNow, parseISO, differenceInDays, isValid } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string => {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) return '-'
  
  return format(dateObj, formatStr, { locale: zhCN })
}

export const formatDateTime = (date: Date | string | null | undefined): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss')
}

export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) return '-'
  
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN })
}

export const getDaysUntilExpiry = (endDate: Date | string | null | undefined): number | null => {
  if (!endDate) return null
  
  const dateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  if (!isValid(dateObj)) return null
  
  return differenceInDays(dateObj, new Date())
}

export const getExpiryStatus = (endDate: Date | string | null | undefined): 'expired' | 'critical' | 'warning' | 'normal' | null => {
  const days = getDaysUntilExpiry(endDate)
  
  if (days === null) return null
  
  if (days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 60) return 'warning'
  return 'normal'
}

export const getExpiryLabel = (endDate: Date | string | null | undefined): string => {
  const days = getDaysUntilExpiry(endDate)
  
  if (days === null) return '-'
  
  if (days < 0) return `已过期 ${Math.abs(days)} 天`
  if (days === 0) return '今日到期'
  return `${days} 天后到期`
}

export default formatDate