export type Role = 'invigilator' | 'admin' | 'tech'

export interface RoleInfo {
  role: Role
  name: string
  permissions: string[]
}

export interface Exam {
  id: string
  name: string
  date: string
  totalCandidates: number
  totalRooms: number
}

export interface Room {
  id: string
  name: string
  capacity: number
}

export interface Subject {
  id: string
  name: string
}

export interface Candidate {
  id: string
  name: string
  ticketNo: string
  roomId: string
  subjectId: string
  score: number | null
}

export interface Invigilator {
  id: string
  name: string
  roomId: string
  phone: string
}

export interface RegistrationInfo {
  totalRegistered: number
  totalPaid: number
  totalUnpaid: number
  subjects: { subjectId: string; subjectName: string; count: number }[]
  rooms: { roomId: string; roomName: string; count: number }[]
}

export interface RoomArrangementInfo {
  totalRooms: number
  utilizedRooms: number
  totalCapacity: number
  arrangements: { roomId: string; roomName: string; capacity: number; assigned: number; utilization: number }[]
}

export interface InvigilatorInfo {
  totalInvigilators: number
  assignedRooms: number
  unassignedRooms: number
  assignments: { invigilatorId: string; invigilatorName: string; roomId: string; roomName: string; phone: string }[]
}

export type AVType = 'absence' | 'violation'
export type AVStatus = 'pending' | 'approved' | 'rejected' | 'supplemented' | 'resubmitted'
export type ViolationCategory = 'cheat' | 'impersonate' | 'disrupt' | 'device' | 'other'

export interface AbsenceViolationRecord {
  id: string
  candidateId: string
  type: AVType
  violationType: ViolationCategory | null
  roomId: string
  subjectId: string
  status: AVStatus
  submittedBy: string
  reviewedBy: string | null
  opinion: string | null
  remark: string
  createdAt: string
  reviewedAt: string | null
  version: number
  parentId: string | null
}

export type SPStatus = 'initiated' | 'approved' | 'confirmed' | 'rejected'

export interface ScoreSummary {
  total: number
  pass: number
  fail: number
  max: number
  min: number
  avg: number
}

export interface ScorePublishRecord {
  id: string
  subjectId: string
  status: SPStatus
  initiatedBy: string
  confirmedBy: string | null
  rejectedBy: string | null
  opinion: string | null
  summary: ScoreSummary
  createdAt: string
  confirmedAt: string | null
  rejectedAt: string | null
  version: number
}

export interface AuditLog {
  id: string
  targetType: 'absence-violation' | 'score-publish' | 'export' | 'stage'
  targetId: string
  action: string
  operatorRole: Role
  operatorName: string
  detail: string
  createdAt: string
  fromStatus?: string
  toStatus?: string
}

export type ExportType = 'absence-violation' | 'score'
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExportTask {
  id: string
  type: ExportType
  status: ExportStatus
  createdBy: string
  downloadUrl: string | null
  filters: Record<string, string>
  createdAt: string
  completedAt: string | null
  recordCount: number
}

export type StageName = 'registration' | 'room-arrangement' | 'invigilator-assignment' | 'absence-violation' | 'score-publish'

export interface StageInfo {
  name: string
  key: StageName
  status: 'completed' | 'active' | 'pending'
  pendingCount: number
  completedAt?: string
  operatorName?: string
}

export interface AVStats {
  pending: number
  resubmitted: number
  approved: number
  rejected: number
  supplemented: number
  total: number
}

export interface SPStats {
  initiated: number
  approved: number
  confirmed: number
  rejected: number
  total: number
}

export interface DashboardData {
  examName: string
  examDate: string
  totalCandidates: number
  totalRooms: number
  stages: StageInfo[]
  recentLogs: AuditLog[]
  registration: RegistrationInfo
  roomArrangement: RoomArrangementInfo
  invigilatorAssignment: InvigilatorInfo
  avStats: AVStats
  spStats: SPStats
}

export interface CandidateDetail {
  candidate: Candidate
  room: Room
  subject: Subject
  avRecords: AbsenceViolationRecord[]
  auditLogs: AuditLog[]
}

export interface StageProgress {
  stage: StageName
  stageName: string
  order: number
  canProceed: boolean
  blockers: string[]
  nextAction: string | null
  nextRole: Role | null
}
