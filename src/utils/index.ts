import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PurchaseStatus, ExceptionType, Role } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusConfig: Record<PurchaseStatus, { label: string; color: string; bgColor: string }> = {
  pending_acceptance: { label: '待验收', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  accepted: { label: '已验收', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  rejected: { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  supplementing: { label: '待补充', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  supplement_submitted: { label: '已补录待重验', color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200' },
  overdue: { label: '逾期未处理', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  dispute_pending: { label: '待仲裁', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  dispute_processing: { label: '争议处理中', color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200' },
  sample_pending: { label: '待留样', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  sample_completed: { label: '留样完成待确认', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  sample_confirmed: { label: '留样已确认', color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200' },
  completed: { label: '流程完成', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
}

export const exceptionTypeConfig: Record<ExceptionType, { label: string; color: string; icon: string }> = {
  reject: { label: '驳回', color: 'text-red-600', icon: 'x-circle' },
  supplement: { label: '补充材料', color: 'text-orange-600', icon: 'file-plus' },
  overdue: { label: '逾期', color: 'text-red-600', icon: 'clock' },
  dispute: { label: '争议', color: 'text-purple-600', icon: 'alert-triangle' },
}

export const roleConfig: Record<Role, { label: string; color: string }> = {
  admin: { label: '食堂管理员', color: 'bg-blue-100 text-blue-800' },
  purchaser: { label: '采购员', color: 'bg-green-100 text-green-800' },
  teacher: { label: '班主任', color: 'bg-purple-100 text-purple-800' },
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

export function getTimeRemaining(deadline: string): string {
  const now = new Date()
  const dl = new Date(deadline)
  const diff = dl.getTime() - now.getTime()
  
  if (diff <= 0) return '已逾期'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}天${hours % 24}小时`
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}
