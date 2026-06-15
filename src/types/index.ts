export type Grade = 'A' | 'B' | 'C' | 'D' | 'scrap'

export type DeviceStatus =
  | 'received'
  | 'inspecting'
  | 'graded'
  | 'confirmed'
  | 'paying'
  | 'completed'
  | 'returned'

export type RiskType = 'price_regret' | 'hidden_defect' | 'payment_error' | 'review'

export type RiskSeverity = 'high' | 'medium' | 'low'

export type RiskStatus = 'pending' | 'processing' | 'resolved'

export type Role = 'receiver' | 'inspector' | 'finance' | 'manager'

export type InspectionResult = 'pass' | 'fail' | 'skip'

export interface Device {
  id: string
  model: string
  brand: string
  imei: string
  storage: string
  color: string
  appearanceScore: number
  estimatedPrice: number
  finalPrice: number | null
  grade: Grade | null
  status: DeviceStatus
  customerId: string
  customerName: string
  customerPhone: string
  paymentAccount: string
  paymentBank: string
  receivedAt: string
  receivedBy: string
  inspectedAt: string | null
  inspectedBy: string | null
  paidAt: string | null
  paidBy: string | null
}

export interface InspectionItem {
  category: string
  name: string
  result: InspectionResult | null
  note: string
}

export interface InspectionReport {
  deviceId: string
  items: InspectionItem[]
  hiddenDefects: string[]
  gradeReason: string
  submittedAt: string
}

export interface RiskFlag {
  id: string
  deviceId: string
  type: RiskType
  severity: RiskSeverity
  description: string
  status: RiskStatus
  createdAt: string
  resolvedAt: string | null
}

export interface HistoryEntry {
  id: string
  deviceId: string
  action: string
  operator: string
  role: Role
  detail: string
  timestamp: string
}
