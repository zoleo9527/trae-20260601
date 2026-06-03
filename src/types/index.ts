export type ParticipantStatus = 'registered' | 'checked_in' | 'withdrawn' | 'disqualified'

export type AnomalyType = 'id_mismatch' | 'duplicate_entry' | 'group_conflict' | 'other'

export type AnomalyStatus = 'pending' | 'resolved' | 'dismissed'

export type GroupName = '亲子组' | '公开组' | '企业团体'

export interface Participant {
  id: string
  name: string
  bibNumber: string
  group: GroupName
  team?: string
  idNumber: string
  phone: string
  status: ParticipantStatus
  gender: '男' | '女'
  age: number
  emergencyContact: string
  emergencyPhone: string
  isWaitlisted: boolean
  registeredAt: string
}

export interface BibRecord {
  participantId: string
  issued: boolean
  issuedAt?: string
  issuedBy?: string
}

export interface CheckInRecord {
  participantId: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
}

export interface WithdrawalRecord {
  id: string
  participantId: string
  reason: string
  withdrewAt: string
  recordedBy: string
}

export interface AnomalyRecord {
  id: string
  participantId: string
  type: AnomalyType
  description: string
  status: AnomalyStatus
  reportedAt: string
  reportedBy: string
}
