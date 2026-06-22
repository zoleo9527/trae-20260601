import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WorkOrder, Remark } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const remarkTypePriority: Record<string, number> = {
  complete: 5,
  return: 4,
  supplement: 3,
  onsite: 2,
  dispatch: 1,
}

export function getLatestRemark(workOrder: WorkOrder): Remark | null {
  if (workOrder.remarks.length === 0) return null
  const sorted = [...workOrder.remarks].sort((a, b) => {
    const timeDiff =
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    if (timeDiff !== 0) return timeDiff
    return (remarkTypePriority[b.type] || 0) - (remarkTypePriority[a.type] || 0)
  })
  return sorted[0]
}

export function getLatestProgressText(workOrder: WorkOrder): string {
  const latest = getLatestRemark(workOrder)
  if (!latest) return '暂无进展记录'
  return latest.content
}
