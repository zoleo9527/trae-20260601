export interface Project {
  id: string
  name: string
  address: string
  manager: string
  status: 'active' | 'completed'
  startDate: string
}

export interface CableType {
  id: string
  model: string
  name: string
  unit: string
  spec: string
  stock: number
  designQty?: number
}

export interface RequisitionItem {
  cableId: string
  cableModel: string
  cableName: string
  quantity: number
  designQty?: number
  overFlag?: boolean
}

export type RequisitionTag = 'normal' | 'over' | 'wrong' | 'supplement'
export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'issued' | 'completed'

export interface Requisition {
  id: string
  code: string
  projectId: string
  teamId: string
  items: RequisitionItem[]
  status: RequisitionStatus
  tags: RequisitionTag[]
  applicant: string
  applyTime: string
  approver?: string
  approveTime?: string
  approverRemark?: string
  issuer?: string
  issueTime?: string
  relatedId?: string
  remark?: string
}

export interface CheckIn {
  id: string
  projectId: string
  teamId: string
  checkInTime: string
  checkOutTime?: string
  location: { lat: number; lng: number; address: string }
  workers: string[]
  weather?: string
  remark?: string
}

export type TestResult = 'pass' | 'fail' | 'pending'

export interface CablePoint {
  id: string
  checkInId: string
  requisitionId: string
  projectId: string
  pointCode: string
  cableId: string
  cableModel: string
  usedMeters: number
  startPoint: string
  endPoint: string
  photos: string[]
  tester: string
  testResult: TestResult
  remark?: string
  createTime: string
}

export type ShortagePriority = 'normal' | 'urgent' | 'critical'
export type ShortageStatus = 'reported' | 'approved' | 'supplied' | 'closed'

export interface Shortage {
  id: string
  code: string
  projectId: string
  checkInId: string
  cableId: string
  cableModel: string
  shortageQty: number
  priority: ShortagePriority
  photos: string[]
  reporter: string
  reportTime: string
  status: ShortageStatus
  supplementReqId?: string
  remark?: string
}

export type ReturnCondition = 'good' | 'damaged' | 'partial'
export type ReturnStatus = 'pending' | 'received' | 'rejected'

export interface ReturnItem {
  cableId: string
  cableModel: string
  returnQty: number
  condition: ReturnCondition
}

export interface ReturnRecord {
  id: string
  code: string
  requisitionId: string
  projectId: string
  teamId: string
  items: ReturnItem[]
  returner: string
  returnTime: string
  receiver: string
  receiveTime?: string
  photos: string[]
  status: ReturnStatus
  remark?: string
}

export interface Team {
  id: string
  name: string
  leader: string
  phone: string
  members: string[]
}

export type TimelineType =
  | 'requisition'
  | 'approve'
  | 'issue'
  | 'checkin'
  | 'point'
  | 'shortage'
  | 'supplement'
  | 'return'
  | 'archive'

export interface TimelineEvent {
  id: string
  type: TimelineType
  title: string
  description: string
  time: string
  operator: string
  relatedId: string
  color: string
}

export interface TraceRow {
  requisitionCode: string
  requisitionId: string
  tags: string[]
  cableModel: string
  appliedQty: number
  designQty: number
  usedQty: number
  usedPoints: {
    pointCode: string
    usedMeters: number
    testResult: string
    createTime: string
    photos: string[]
  }[]
  returnedQty: number
  balance: number
}
