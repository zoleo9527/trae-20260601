export enum WorkflowStatus {
  PENDING_REGISTRATION = 'PENDING_REGISTRATION',
  PREOP_IN_PROGRESS = 'PREOP_IN_PROGRESS',
  PREOP_REVIEW = 'PREOP_REVIEW',
  PREOP_APPROVED = 'PREOP_APPROVED',
  PREOP_REJECTED = 'PREOP_REJECTED',
  SCHEDULING = 'SCHEDULING',
  SCHEDULE_REVIEW = 'SCHEDULE_REVIEW',
  SCHEDULE_CONFIRMED = 'SCHEDULE_CONFIRMED',
  SCHEDULE_REJECTED = 'SCHEDULE_REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RoleType {
  RECEPTIONIST = 'RECEPTIONIST',
  SPECIALIST = 'SPECIALIST',
  SUPERVISOR = 'SUPERVISOR'
}

export enum SurgeryType {
  CATARACT = 'CATARACT',
  LASIK = 'LASIK',
  ICL = 'ICL',
  GLAUCOMA = 'GLAUCOMA',
  RETINA = 'RETINA',
  PTERYGIUM = 'PTERYGIUM'
}

export enum CheckItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABNORMAL = 'ABNORMAL'
}

export interface WorkflowSimpleVO {
  id: number
  workflowNo: string
  patientName: string
  surgeryType: SurgeryType
  surgeryTypeName: string
  status: WorkflowStatus
  statusName: string
  currentHandler: string | null
  blockReason: string
  createdAt: string
}

export interface CheckItemVO {
  id: number
  checkType: string
  checkTypeName: string
  status: CheckItemStatus
  statusName: string
  checkResult: string | null
  measurementValue: string | null
  referenceRange: string | null
  checkedByName: string | null
  checkedAt: string | null
  remarks: string | null
  attachmentUrl: string | null
}

export interface ScheduleInfoVO {
  id: number
  surgeryDate: string
  startTime: string
  endTime: string
  operatingRoom: string
  surgeonName: string | null
  anesthesiologistName: string | null
  materialList: string | null
  remarks: string | null
  confirmed: boolean
}

export interface OperationLogVO {
  id: number
  operationType: string
  operationDesc: string
  previousStatus: string | null
  newStatus: string | null
  operatorName: string
  remarks: string | null
  createdAt: string
}

export interface WorkflowDetailVO {
  id: number
  workflowNo: string
  patientId: number
  patientName: string
  patientNo: string
  surgeryType: SurgeryType
  surgeryTypeName: string
  status: WorkflowStatus
  statusName: string
  statusDescription: string
  currentHandler: string | null
  currentHandlerRole: string | null
  blockReason: string
  remarks: string | null
  createdAt: string
  updatedAt: string
  statusUpdatedAt: string
  checkItems: CheckItemVO[]
  scheduleInfo: ScheduleInfoVO | null
  operationLogs: OperationLogVO[]
}

export interface UserVO {
  id: number
  username: string
  realName: string
  role: RoleType
  roleName: string
  department: string
}

export interface ScheduleVO {
  id: number
  workflowNo: string
  patientName: string
  surgeryType: SurgeryType
  surgeryTypeName: string
  surgeryDate: string
  startTime: string
  endTime: string
  operatingRoom: string
  surgeonName: string | null
  materialList: string | null
}
