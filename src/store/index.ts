import { create } from 'zustand'

interface AppState {
  currentRole: 'sales' | 'warehouse' | 'aftersales'
  setCurrentRole: (role: 'sales' | 'warehouse' | 'aftersales') => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'sales',
  setCurrentRole: (role) => set({ currentRole: role }),
}))

export type OutboundOrderStatus = 'pending_submit' | 'pending_review' | 'reviewing' | 'completed' | 'has_issue' | 'closed'

export interface OutboundOrder {
  id: string
  orderNo: string
  customerName: string
  customerQualExpiry: string
  submittedBy: string | null
  submittedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  status: OutboundOrderStatus
  createdAt: string
  updatedAt: string
  items: OutboundItem[]
  timeline: TimelineEntry[]
  reviewSnapshots: ReviewSnapshot[]
}

export interface OutboundItem {
  id: string
  orderId: string
  consumableName: string
  batchNo: string
  productionDate: string
  expiryDate: string
  stockQty: number
  outboundQty: number
  reviewStatus: 'normal' | 'abnormal' | 'pending'
  abnormalType: string | null
  abnormalNote: string | null
  createdAt: string
}

export interface TimelineEntry {
  id: string
  orderId: string
  action: string
  operator: string
  operatorRole: string
  detail: string
  createdAt: string
}

export interface ReviewSnapshot {
  id: string
  orderId: string
  reviewedBy: string
  reviewAt: string
  items: ReviewSnapshotItem[]
}

export interface ReviewSnapshotItem {
  id: string
  snapshotId: string
  itemId: string
  consumableName: string
  batchNo: string
  result: 'normal' | 'abnormal'
  abnormalType: string | null
  abnormalNote: string | null
}

export interface BatchIssue {
  id: string
  orderId: string
  orderNo: string
  itemId: string
  consumableName: string
  batchNo: string
  abnormalType: 'batch_error' | 'near_expiry' | 'expired' | 'qual_expired'
  abnormalNote: string
  processStatus: 'pending' | 'processed'
  processResult: 'exchange' | 'return' | 'special_approval' | null
  processNote: string | null
  processedBy: string | null
  processedAt: string | null
  createdAt: string
}

export const abnormalTypeLabels: Record<string, string> = {
  batch_error: '批号错误',
  near_expiry: '临期',
  expired: '已过期',
  qual_expired: '资质过期',
}

export const processResultLabels: Record<string, string> = {
  exchange: '换货',
  return: '退货',
  special_approval: '特批放行',
}

export const roleLabels: Record<string, string> = {
  sales: '销售内勤',
  warehouse: '仓库员',
  aftersales: '售后专员',
}

export const roleNames: Record<string, string> = {
  张丽: 'sales',
  刘芳: 'sales',
  王强: 'warehouse',
  赵磊: 'warehouse',
  李敏: 'aftersales',
}
