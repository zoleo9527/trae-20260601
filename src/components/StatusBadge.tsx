import { cn } from '@/lib/utils'
import type { QualificationStatus, PurchaseStatus } from '@/types'

const qualificationLabels: Record<QualificationStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  expiring_soon: '即将到期',
  expired: '已过期',
}

const qualificationColors: Record<QualificationStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expiring_soon: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
}

const qualificationDotColors: Record<QualificationStatus, string> = {
  pending: 'bg-gray-400',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  expiring_soon: 'bg-amber-500',
  expired: 'bg-red-500',
}

const purchaseLabels: Record<PurchaseStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已审核',
  rejected: '已驳回',
  confirmed_out: '已出库',
  shipped: '已发货',
  completed: '已完成',
}

const purchaseColors: Record<PurchaseStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  confirmed_out: 'bg-teal-100 text-teal-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

const purchaseDotColors: Record<PurchaseStatus, string> = {
  draft: 'bg-gray-400',
  pending_review: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  confirmed_out: 'bg-teal-500',
  shipped: 'bg-indigo-500',
  completed: 'bg-emerald-500',
}

interface QualificationBadgeProps {
  status: QualificationStatus
  className?: string
}

export function QualificationBadge({ status, className }: QualificationBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', qualificationColors[status], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', qualificationDotColors[status])} />
      {qualificationLabels[status]}
    </span>
  )
}

interface PurchaseBadgeProps {
  status: PurchaseStatus
  className?: string
}

export function PurchaseBadge({ status, className }: PurchaseBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', purchaseColors[status], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', purchaseDotColors[status])} />
      {purchaseLabels[status]}
    </span>
  )
}
