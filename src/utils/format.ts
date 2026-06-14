import type { RectificationStatus, ReinspectionStatus, UserRole } from '@/types'

export const rectificationStatusLabel: Record<RectificationStatus, string> = {
  pending: '待处理',
  submitted: '已提交待审',
  rejected: '被驳回需补录',
  passed: '整改合格',
}

export const reinspectionStatusLabel: Record<ReinspectionStatus, string> = {
  pending: '待安排',
  scheduled: '已安排',
  completed: '已完成',
  abnormal: '异常',
  cancelled: '已取消',
}

export const roleLabel: Record<UserRole, string> = {
  receiver: '接车员',
  inspector: '检测员',
  auditor: '审核员',
}

export function formatDateTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isOverdue(deadlineIso?: string) {
  if (!deadlineIso) return false
  return new Date(deadlineIso).getTime() < Date.now()
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  return `${days} 天前`
}

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10)
}
