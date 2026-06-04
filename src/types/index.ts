export type Role = 'nurse' | 'surgeon' | 'specialist'

export interface User {
  id: string
  username: string
  name: string
  role: Role
}

export interface Patient {
  id: string
  name: string
  gender: '男' | '女'
  age: number
  phone: string
  idCard: string
  surgeryDate: string
  surgeryType: string
  surgeonName: string
  eye: '左眼' | '右眼' | '双眼'
}

export type MedicationStatus = 'pending' | 'nurse_confirmed' | 'surgeon_verified' | 'patient_acknowledged' | 'completed' | 'exception'

export interface MedicationItem {
  id: string
  name: string
  specification: string
  dosage: string
  frequency: string
  duration: string
  notes: string
}

export interface MedicationTask {
  id: string
  patientId: string
  patientName: string
  surgeryType: string
  surgeryDate: string
  eye: string
  status: MedicationStatus
  items: MedicationItem[]
  surgeonName: string
  nurseName?: string
  createdAt: string
  updatedAt: string
  hasRisk: boolean
  riskReason?: string
}

export type FollowupStatus = 'pending' | 'notified' | 'confirmed' | 'completed' | 'rescheduled' | 'missed'

export type FollowupAction = 'notify_patient' | 'confirm_attendance' | 'complete_followup' | 'reschedule' | 'mark_missed'

export interface ProcessFollowupRequest {
  action: FollowupAction
  status: FollowupStatus
  remark: string
  specialist_name?: string
  scheduled_date?: string
  scheduled_time?: string
}

export interface FollowupTask {
  id: string
  patientId: string
  patientName: string
  phone: string
  surgeryDate: string
  surgeryType: string
  scheduledDate: string
  scheduledTime: string
  status: FollowupStatus
  followupType: '术后1天' | '术后1周' | '术后1月' | '术后3月'
  content: string
  specialistName?: string
  previousTaskId?: string
  createdAt: string
  updatedAt: string
  hasRisk: boolean
  riskReason?: string
}

export interface OperationLog {
  id: string
  taskId: string
  taskType: 'medication' | 'followup'
  operatorName: string
  operatorRole: string
  action: string
  description: string
  oldStatus?: string
  newStatus?: string
  remark?: string
  createdAt: string
}

export interface DashboardStats {
  todoCount: number
  riskCount: number
  todayMedicationCount: number
  todayFollowupCount: number
  pendingMedicationCount: number
  pendingFollowupCount: number
  recentChanges: RecentChange[]
  todoItems: TodoItem[]
  riskItems: RiskItem[]
}

export interface RecentChange {
  id: string
  taskId: string
  type: 'medication' | 'followup'
  patientName: string
  action: string
  operatorName: string
  time: string
}

export interface TodoItem {
  id: string
  type: 'medication' | 'followup'
  patientName: string
  title: string
  priority: 'high' | 'medium' | 'low'
  time: string
}

export interface RiskItem {
  id: string
  type: 'medication' | 'followup'
  patientName: string
  reason: string
  level: 'high' | 'medium' | 'low'
}
