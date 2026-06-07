export type UserRole = 'station_master' | 'cashier' | 'gauge_officer'

export interface User {
  id: string
  name: string
  role: UserRole
  phone: string
  avatar: string
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'abnormal' | 'recheck'
export type RepairStatus = 'submitted' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'verified' | 'closed'

export interface StatusLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: UserRole
  fromStatus: string
  toStatus: string
  remark: string
}

export interface ProgressLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: UserRole
  type: 'progress' | 'solution'
  oldValue: string
  newValue: string
  remark: string
}

export interface InspectionItem {
  id: string
  name: string
  category: string
  result: 'normal' | 'abnormal' | 'na'
  remark: string
}

export interface DeviceInspection {
  id: string
  inspectionNo: string
  deviceName: string
  deviceCode: string
  location: string
  inspectorId: string
  inspectorName: string
  scheduledDate: string
  actualDate: string
  status: InspectionStatus
  items: InspectionItem[]
  overallRemark: string
  statusLogs: StatusLog[]
  relatedRepairId?: string
  createdAt: string
  updatedAt: string
}

export interface AbnormalRepair {
  id: string
  repairNo: string
  deviceName: string
  deviceCode: string
  location: string
  reporterId: string
  reporterName: string
  reporterRole: UserRole
  assigneeId?: string
  assigneeName?: string
  reportedAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  abnormalDescription: string
  status: RepairStatus
  statusLogs: StatusLog[]
  relatedInspectionId?: string
  inspectionUpdates: {
    timestamp: string
    inspectionId: string
    fromStatus: InspectionStatus
    inspectionStatus: InspectionStatus
    inspectionRemark: string
    operatorName: string
    operatorRole: UserRole
  }[]
  repairProgress: string
  progressLogs: ProgressLog[]
  solution?: string
  completedAt?: string
  verifierId?: string
  verifierName?: string
  verifiedAt?: string
  createdAt: string
  updatedAt: string
}
