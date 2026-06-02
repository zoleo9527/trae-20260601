export type ResidentType = 'owner' | 'tenant' | 'family'
export type CardStatus = 'active' | 'inactive' | 'lost' | 'expired' | 'pending'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type ApplicationType = 'new' | 'reissue' | 'permission'
export type UserRole = 'reception' | 'admin'

export interface House {
  id: number
  building: string
  unit: string
  room: string
  floor: number
  area: number
  ownerId: number | null
  createdAt: string
  updatedAt: string
}

export interface Resident {
  id: number
  name: string
  phone: string
  idCard: string
  type: ResidentType
  houseId: number
  leaseStart?: string
  leaseEnd?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface PermissionGroup {
  id: number
  name: string
  description: string
  doors: string[]
  elevators: number[]
  hasGarage: boolean
  garageZones: string[]
  createdAt: string
  updatedAt: string
}

export interface AccessCard {
  id: number
  cardNo: string
  residentId: number
  permissionGroupId: number
  status: CardStatus
  issueDate: string
  expireDate?: string
  lastUsed?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface CardApplication {
  id: number
  type: ApplicationType
  residentId: number
  cardId?: number
  permissionGroupId: number
  status: ApplicationStatus
  reason: string
  applicant: string
  reviewer?: string
  reviewComment?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface OperationLog {
  id: number
  operator: string
  action: string
  targetType: string
  targetId: number
  detail: string
  createdAt: string
}

export interface AccessEvent {
  id: number
  cardNo: string
  doorName: string
  eventTime: string
  success: boolean
  reason?: string
}

export interface SearchResult {
  resident: Resident
  house: House
  cards: AccessCard[]
  permissionGroup: PermissionGroup | null
}
