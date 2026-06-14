export type RoomStatus = "pending" | "arranged" | "submitted" | "returned" | "confirmed"
export type SeatStatus = "empty" | "assigned" | "conflict"
export type RiskLevel = "high" | "medium" | "low"
export type RiskType = "capacity_overflow" | "seat_conflict" | "no_invigilator" | "time_conflict"
export type OperatorRole = "exam_staff" | "invigilator" | "tech_support"

export interface Seat {
  id: string
  row: number
  col: number
  candidateId?: string
  candidateName?: string
  status: SeatStatus
}

export interface Candidate {
  id: string
  name: string
  subject: string
  examRoomId?: string
}

export interface ExamRoom {
  id: string
  name: string
  building: string
  floor: number
  capacity: number
  rows: number
  cols: number
  subject: string
  examDate: string
  timeSlot: string
  status: RoomStatus
  arrangedBy?: string
  arrangedAt?: string
  submittedBy?: string
  submittedAt?: string
  confirmedBy?: string
  confirmedAt?: string
  returnedBy?: string
  returnedAt?: string
  returnReason?: string
  seats: Seat[]
}

export interface AuditLog {
  id: string
  operatorId: string
  operatorName: string
  operatorRole: OperatorRole
  action: string
  targetId: string
  targetType: "exam_room" | "seat"
  detail: string
  timestamp: string
}

export interface RiskItem {
  id: string
  type: RiskType
  level: RiskLevel
  roomId: string
  roomName: string
  description: string
  resolved: boolean
}

export interface SeatSnapshot {
  id: string
  roomId: string
  seats: Seat[]
  timestamp: string
  operatorName: string
  action: string
}
