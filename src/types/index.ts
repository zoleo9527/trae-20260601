export interface CreateTeamBuildingRequest {
  name: string
  contactName: string
  contactPhone: string
  date: string
  participantCount: number
  notes?: string
  privateRooms?: PrivateRoomCreate[]
  accommodations?: AccommodationCreate[]
  ingredients?: IngredientCreate[]
}

export interface PrivateRoomCreate {
  name: string
  capacity: number
  bookedAt: string
  notes?: string
}

export interface AccommodationCreate {
  roomNumber: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  depositAmount?: number
  depositPaid?: boolean
  notes?: string
}

export interface IngredientCreate {
  name: string
  quantity: number
  unit: string
  unitPrice: number
  stockStatus: 'SUFFICIENT' | 'LOW' | 'INSUFFICIENT'
  notes?: string
}

export interface UpdateTeamBuildingRequest {
  name?: string
  contactName?: string
  contactPhone?: string
  date?: string
  participantCount?: number
  status?: ActivityStatus
  notes?: string
}

export type ActivityStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export type SettlementStatus = 'UNSETTLED' | 'PARTIAL' | 'SETTLED' | 'DISPUTED'

export interface UpdateSettlementRequest {
  status?: SettlementStatus
  totalAmount?: number
  depositAmount?: number
  paidAmount?: number
  notes?: string
}

export interface TeamBuildingFilter {
  status?: ActivityStatus
  riskLevel?: RiskLevel
  dateStart?: string
  dateEnd?: string
  keyword?: string
}

export interface SettlementFilter {
  status?: SettlementStatus
  dateStart?: string
  dateEnd?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}