import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WorkOrder, Remark } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLatestRemark(workOrder: WorkOrder): Remark | null {
  if (workOrder.remarks.length === 0) return null
  const sorted = [...workOrder.remarks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  return sorted[0]
}

export function getLatestProgressText(workOrder: WorkOrder): string {
  const latest = getLatestRemark(workOrder)
  if (!latest) return '暂无进展记录'
  return latest.content
}
