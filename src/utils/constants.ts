import { type EpisodeStatus } from '@/store/useStore'

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  translating: '翻译中',
  timing: '时间轴',
  reviewing: '校对中',
  rework: '返工中',
  approved: '已通过',
  encoding: '压制中',
  encoded: '已压制',
  delivering: '待交付',
  delivered: '已交付',
}

export const STATUS_COLOR: Record<EpisodeStatus, string> = {
  translating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  timing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  reviewing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rework: 'bg-red-500/20 text-red-400 border-red-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  encoding: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  encoded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  delivering: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export const STATUS_DOT: Record<EpisodeStatus, string> = {
  translating: 'bg-blue-400',
  timing: 'bg-cyan-400',
  reviewing: 'bg-purple-400',
  rework: 'bg-red-400',
  approved: 'bg-green-400',
  encoding: 'bg-orange-400',
  encoded: 'bg-amber-400',
  delivering: 'bg-yellow-400',
  delivered: 'bg-emerald-400',
}

export const ROLE_LABEL: Record<string, string> = {
  translator: '译员',
  timer: '时间轴',
  reviewer: '校对',
  encoder: '压制',
}

export const COMMENT_TYPE_LABEL: Record<string, string> = {
  typo: '错字',
  timing: '时间轴',
  meaning: '译意',
  style: '风格',
  other: '其他',
}

export const COMMENT_TYPE_COLOR: Record<string, string> = {
  typo: 'bg-red-500/20 text-red-400',
  timing: 'bg-cyan-500/20 text-cyan-400',
  meaning: 'bg-purple-500/20 text-purple-400',
  style: 'bg-blue-500/20 text-blue-400',
  other: 'bg-zinc-500/20 text-zinc-400',
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}天前`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

export function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}
