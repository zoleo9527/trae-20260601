export type InstrumentStatus = 'normal' | 'fault' | 'maintenance'

export interface Instrument {
  id: string
  name: string
  code: string
  status: InstrumentStatus
  nightMode: boolean
  nightStart: string
  nightEnd: string
  location: string
}

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'postponed' | 'cancelled'

export interface Reservation {
  id: string
  instrumentId: string
  userId: string
  userName: string
  userGroup: string
  startTime: string
  endTime: string
  status: ReservationStatus
  reason: string
  sampleIds: string[]
  createdAt: string
}

export type SampleStatus = 'waiting' | 'testing' | 'done' | 'abnormal'

export interface Sample {
  id: string
  reservationId: string
  instrumentId: string
  name: string
  submitter: string
  group: string
  status: SampleStatus
  storageLocation: string
  notes: string
  createdAt: string
}

export type DowntimeStatus = 'active' | 'resolved'

export interface Downtime {
  id: string
  instrumentId: string
  startTime: string
  endTime: string
  reason: string
  status: DowntimeStatus
  affectedReservations: string[]
  createdAt: string
}

export type NotificationType = 'approval' | 'rejection' | 'postpone' | 'cancel' | 'downtime' | 'restore'

export interface Notification {
  id: string
  type: NotificationType
  recipientId: string
  recipientName: string
  instrumentId: string
  reservationId?: string
  message: string
  createdAt: string
  read: boolean
}

export type UserRole = 'admin' | 'leader' | 'student'

export interface User {
  id: string
  name: string
  role: UserRole
  group: string
}
