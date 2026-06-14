export type UserRole = 'receiver' | 'inspector' | 'auditor'

export interface User {
  id: string
  name: string
  role: UserRole
  roleLabel: string
}

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'bus' | 'van'

export interface Vehicle {
  id: string
  plateNumber: string
  vehicleType: VehicleType
  vehicleTypeLabel: string
  ownerName: string
  ownerPhone: string
  firstRegisterDate: string
  vin: string
}

export type InspectionResult = 'passed' | 'failed'

export interface DefectItem {
  code: string
  name: string
  category: string
  description: string
  severity: 'minor' | 'major' | 'critical'
}

export interface Inspection {
  id: string
  vehicleId: string
  inspectorId: string
  inspectorName: string
  inspectTime: string
  result: InspectionResult
  defectItems: DefectItem[]
  odometer: number
  lane: string
  remark?: string
}

export type RectificationStatus = 'pending' | 'submitted' | 'rejected' | 'passed'

export interface RectificationMaterial {
  name: string
  type: 'photo' | 'receipt' | 'screenshot' | 'other'
  uploadedAt: string
  uploadedBy: string
}

export interface RejectRecord {
  id: string
  auditorId: string
  auditorName: string
  reason: string
  timestamp: string
  rejectedItems: string[]
}

export interface SupplementRecord {
  id: string
  handlerId: string
  handlerName: string
  materials: RectificationMaterial[]
  description: string
  timestamp: string
}

export interface Rectification {
  id: string
  inspectionId: string
  vehicleId: string
  status: RectificationStatus
  rejectCount: number
  materials: RectificationMaterial[]
  deadline: string
  handlerId: string
  handlerName: string
  submittedAt?: string
  auditorId?: string
  auditorName?: string
  auditedAt?: string
  description: string
  rejectHistory: RejectRecord[]
  supplementHistory: SupplementRecord[]
  latestRejectReason?: string
}

export type ReinspectionStatus = 'pending' | 'scheduled' | 'completed' | 'abnormal' | 'cancelled'

export interface ScheduleRecord {
  id: string
  arrangedById: string
  arrangedByName: string
  scheduledTime: string
  lane: string
  timestamp: string
  cancelReason?: string
  cancelledAt?: string
}

export interface Reinspection {
  id: string
  inspectionId: string
  vehicleId: string
  status: ReinspectionStatus
  scheduledTime?: string
  lane?: string
  inspectorId?: string
  inspectorName?: string
  result?: InspectionResult
  abnormalReason?: string
  arrangedBy?: string
  arrangedByName?: string
  arrangedAt?: string
  completedAt?: string
  remark?: string
  scheduleHistory: ScheduleRecord[]
  resultDetail?: {
    passedItems: string[]
    failedItems: DefectItem[]
    completedBy: string
    completedAt: string
  }
}

export type OperationLogAction =
  | '检测完成'
  | '创建整改任务'
  | '提交整改材料'
  | '补录整改材料'
  | '审核通过'
  | '驳回整改'
  | '生成复检待办'
  | '安排复检'
  | '改排复检'
  | '取消复检安排'
  | '复检完成'
  | '复检异常'
  | '处理复检异常'

export interface OperationLog {
  id: string
  vehicleId: string
  inspectionId?: string
  rectificationId?: string
  reinspectionId?: string
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  operatorRoleLabel: string
  action: OperationLogAction
  content: string
  timestamp: string
}

export interface AppState {
  currentUser: User
  users: User[]
  vehicles: Vehicle[]
  inspections: Inspection[]
  rectifications: Rectification[]
  reinspections: Reinspection[]
  logs: OperationLog[]
}
