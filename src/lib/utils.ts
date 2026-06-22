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

export function getDispatchRound(workOrder: WorkOrder): number {
  return workOrder.remarks.filter((r) => r.type === 'dispatch').length
}

export function getSortedRemarks(workOrder: WorkOrder): Remark[] {
  return [...workOrder.remarks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

export interface BlockSummary {
  dispatcherName: string | null
  dispatchTime: string | null
  electricianName: string | null
  dispatchRemark: string | null
  lastReturnReason: string | null
  lastReturnTime: string | null
  completeResult: string | null
  completeTime: string | null
}

export function getCurrentBlockSummary(workOrder: WorkOrder): BlockSummary {
  const sorted = getSortedRemarks(workOrder)
  const result: BlockSummary = {
    dispatcherName: null,
    dispatchTime: null,
    electricianName: null,
    dispatchRemark: null,
    lastReturnReason: null,
    lastReturnTime: null,
    completeResult: null,
    completeTime: null,
  }

  const dispatchRemarks = sorted.filter((r) => r.type === 'dispatch')
  if (dispatchRemarks.length > 0) {
    const lastDispatch = dispatchRemarks[dispatchRemarks.length - 1]
    result.dispatcherName = lastDispatch.authorName
    result.dispatchTime = lastDispatch.timestamp
    result.dispatchRemark = lastDispatch.content
  }

  if (workOrder.electricianName) {
    result.electricianName = workOrder.electricianName
  }

  const returnRemarks = sorted.filter((r) => r.type === 'return')
  if (returnRemarks.length > 0) {
    const lastReturn = returnRemarks[returnRemarks.length - 1]
    result.lastReturnReason = lastReturn.content
    result.lastReturnTime = lastReturn.timestamp
  }

  const completeRemarks = sorted.filter((r) => r.type === 'complete')
  if (completeRemarks.length > 0) {
    const lastComplete = completeRemarks[completeRemarks.length - 1]
    result.completeResult = lastComplete.content
    result.completeTime = lastComplete.timestamp
  }

  return result
}

export function isReturnedAwaitingDispatch(workOrder: WorkOrder): boolean {
  return workOrder.status === 'returned'
}
