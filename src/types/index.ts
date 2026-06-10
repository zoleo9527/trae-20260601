export type Role = 'breeder' | 'sorter' | 'manager'

export interface User {
  id: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export type EggGrade = 'A' | 'B' | 'C'

export interface EggGradeRecord {
  id: string
  batchNumber: string
  grade: EggGrade
  quantity: number
  weight: number
  breederId: string
  breederName: string
  sorterId: string | null
  sorterName: string | null
  status: 'pending' | 'verified' | 'packed'
  createdAt: Date
  updatedAt: Date
}

export interface PackingRecord {
  id: string
  eggGradeRecordId: string
  batchNumber: string
  boxCount: number
  eggsPerBox: number
  totalEggs: number
  destination: string
  transporter: string | null
  managerId: string
  managerName: string
  sortedById: string
  sortedByName: string
  status: 'confirmed' | 'shipped'
  createdAt: Date
  updatedAt: Date
}

export interface ActionLog {
  id: string
  targetType: 'grade' | 'packing'
  targetId: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  timestamp: Date
  details: string
}

export interface PageRequest {
  page: number
  pageSize: number
}

export interface PageResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface EggGradeFilter {
  batchNumber?: string
  grade?: EggGrade
  status?: string
  breederId?: string
  sorterId?: string
  startDate?: string
  endDate?: string
}

export interface PackingFilter {
  batchNumber?: string
  destination?: string
  status?: string
  managerId?: string
  startDate?: string
  endDate?: string
}