export type ProductType = '全瓷冠' | '贴面' | '活动义齿' | '种植修复' | '嵌体'
export type Stage = 'reception' | 'design' | 'qc' | 'production'
export type HandlerRole = 'receptionist' | 'designer' | 'inspector'
export type OrderStatus = 'pending' | 'in_progress' | 'blocked' | 'completed'
export type Priority = 'normal' | 'urgent'
export type AnomalyType = 'missing_material' | 'timeout' | 'qc_failed'
export type MaterialStatus = 'available' | 'missing' | 'ordered'
export type HandoffAction = 'submit' | 'reject' | 'release_material' | 'schedule'

export interface MaterialItem {
  id: string
  name: string
  specification: string
  quantity: number
  status: MaterialStatus
}

export interface Anomaly {
  id: string
  type: AnomalyType
  description: string
  detectedAt: string
  resolvedAt: string | null
  resolvedBy: string | null
}

export interface QCCheckItem {
  name: string
  standard: string
  actual: string
  passed: boolean
}

export interface HandoffDetails {
  reception?: { scanFileType: string; modelType: 'digital' | 'physical'; scanFileCount: number; notes: string }
  design?: { softwareVersion: string; modifications: string[]; colorChangeReason: string | null; specialProcess: string | null }
  qc?: { checkItems: QCCheckItem[]; result: 'pass' | 'fail'; failReason: string | null; reworkTarget: string | null }
  production?: { productionLine: string; estimatedCompletion: string; splitFrom: string | null }
}

export interface HandoffRecord {
  id: string
  orderId: string
  fromRole: HandlerRole
  toRole: HandlerRole
  action: HandoffAction
  reason: string
  details: HandoffDetails
  createdAt: string
}

export interface Order {
  id: string
  orderNo: string
  customerName: string
  patientName: string
  productType: ProductType
  materials?: MaterialItem[]
  materialStatus: 'complete' | 'incomplete'
  missingMaterials: string[]
  currentStage: Stage
  currentHandler: HandlerRole
  priority: Priority
  deliveryDate: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  anomalies: Anomaly[]
  timeInStage: number
  handoffs?: HandoffRecord[]
}

export interface OrderFilter {
  status?: OrderStatus
  stage?: Stage
  anomalyType?: AnomalyType
  customerName?: string
  handlerRole?: HandlerRole
}
