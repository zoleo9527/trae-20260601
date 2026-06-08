import clsx from 'clsx'
import type { DamageSeverity, DamageStatus, DamageCategory, TaskFlag } from '@/types'

const severityConfig: Record<DamageSeverity, { bg: string; text: string; dot: string }> = {
  '轻微': { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
  '一般': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  '严重': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  '特重大': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600' },
}

const statusConfig: Record<DamageStatus, { bg: string; text: string; dot: string }> = {
  '待处理': { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
  '处理中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '待认定': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  '已认定': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '已关闭': { bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-300' },
}

const flagConfig: Record<TaskFlag, { bg: string; text: string; label: string }> = {
  'today': { bg: 'bg-blue-50', text: 'text-blue-700', label: '今日待办' },
  'overdue': { bg: 'bg-red-50', text: 'text-red-700', label: '已拖延' },
  'returned': { bg: 'bg-orange-50', text: 'text-orange-700', label: '被退回' },
}

const categoryConfig: Record<DamageCategory, { bg: string; text: string }> = {
  '包装破损': { bg: 'bg-orange-50', text: 'text-orange-700' },
  '货物湿损': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  '货物丢失': { bg: 'bg-red-50', text: 'text-red-700' },
  '货物变形': { bg: 'bg-purple-50', text: 'text-purple-700' },
  '标签脱落': { bg: 'bg-slate-50', text: 'text-slate-700' },
  '温控异常': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
}

export function SeverityBadge({ severity }: { severity: DamageSeverity }) {
  const cfg = severityConfig[severity]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {severity}
    </span>
  )
}

export function StatusBadge({ status }: { status: DamageStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {status}
    </span>
  )
}

export function FlagBadge({ flag }: { flag: TaskFlag }) {
  const cfg = flagConfig[flag]
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', cfg.bg, cfg.text)}>
      {cfg.label}
    </span>
  )
}

export function CategoryBadge({ category }: { category: DamageCategory }) {
  const cfg = categoryConfig[category]
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', cfg.bg, cfg.text)}>
      {category}
    </span>
  )
}

export function LiabilityStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    '待认定': { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
    '认定中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    '已认定': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    '已退回': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  }
  const cfg = map[status] || map['待认定']
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {status}
    </span>
  )
}
