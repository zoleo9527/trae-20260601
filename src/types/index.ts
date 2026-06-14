export type RecordStatus = 'pending_reception' | 'pending_inspection' | 'pending_review' | 'completed' | 'returned' | 'rejected'
export type ReviewResult = 'pass' | 'return' | 'reject' | null
export type RoleType = 'receptionist' | 'inspector' | 'reviewer'

export interface AppointmentRecord {
  id: string
  plateNumber: string
  ownerName: string
  vehicleType: string
  appointmentTime: string
  status: RecordStatus
  receptionistId: string | null
  receptionTime: string | null
  receptionNotes: string
  inspectorId: string | null
  inspectionTime: string | null
  inspectionResult: string
  reviewerId: string | null
  reviewTime: string | null
  reviewResult: ReviewResult
  returnReason: string
  supplementaryNotes: string
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface ActionLog {
  id: string
  recordId: string
  action: string
  operatorRole: string
  operatorId: string
  timestamp: string
  notes: string
}
