import type { AdjustmentType, AdjustmentStatus, LockStatus, QuoteStatus } from '@/types'

export const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  market_change: '市场价变化',
  customer_negotiation: '客户议价',
  grade_change: '库存等级变化',
}

export const adjustmentTypeColors: Record<AdjustmentType, string> = {
  market_change: 'bg-blue-100 text-blue-800',
  customer_negotiation: 'bg-purple-100 text-purple-800',
  grade_change: 'bg-amber-100 text-amber-800',
}

export const adjustmentStatusLabels: Record<AdjustmentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  expired: '已过期',
}

export const adjustmentStatusColors: Record<AdjustmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
}

export const lockStatusLabels: Record<LockStatus, string> = {
  active: '锁价中',
  expiring_soon: '即将到期',
  expired: '已失效',
}

export const lockStatusColors: Record<LockStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expiring_soon: 'bg-orange-100 text-orange-800',
  expired: 'bg-gray-100 text-gray-600',
}

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  active: '有效',
  expired: '已过期',
  rejected: '已拒绝',
}

export const quoteStatusColors: Record<QuoteStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-800',
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function calcPriceDiffPercent(original: number, newPrice: number): string {
  if (original === 0) return '0%'
  const diff = ((newPrice - original) / original) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}%`
}
