export interface Sow {
  id: string
  earTag: string
  breed: string
  birthDate: string
  parity: number
  status: 'empty' | 'pregnant' | 'lactating' | 'weaning' | 'culled'
  healthStatus: 'healthy' | 'monitoring' | 'sick'
  lastBreedingDate?: string
  expectedFarrowingDate?: string
  litterCount: number
  createdBy: string
  updatedBy: string
  updatedAt: string
}

export interface Boar {
  id: string
  earTag: string
  breed: string
  birthDate: string
  status: 'active' | 'rest' | 'culled'
  healthStatus: 'healthy' | 'monitoring' | 'sick'
  useCount: number
  lastUsedDate?: string
  createdBy: string
  updatedBy: string
  updatedAt: string
}

export interface BreedingPlan {
  id: string
  sowId: string
  boarId: string
  plannedDate: string
  actualDate?: string
  status: 'pending' | 'completed' | 'cancelled' | 'overdue'
  type: 'natural' | 'artificial'
  reason: string
  operator?: string
  createdAt: string
  updatedAt: string
}

export interface BreedingRecord {
  id: string
  planId: string
  sowId: string
  boarId: string
  breedingDate: string
  type: 'natural' | 'artificial'
  result: 'success' | 'failed' | 'pending'
  conceptionConfirmed: boolean
  confirmedDate?: string
  operator: string
  notes?: string
  createdAt: string
}

export interface FarrowingRecord {
  id: string
  sowId: string
  planId?: string
  farrowingDate: string
  totalPigs: number
  livePigs: number
  deadPigs: number
  stillborn: number
  operator: string
  notes?: string
  createdAt: string
}

export interface VaccineRecord {
  id: string
  animalId: string
  animalType: 'sow' | 'boar' | 'piglet'
  vaccineName: string
  dose: number
  unit: string
  injectionDate: string
  nextDueDate?: string
  operator: string
  notes?: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  role: 'breeder' | 'veterinarian' | 'manager'
  department: string
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  targetRole: 'breeder' | 'veterinarian' | 'manager' | 'all'
  read: boolean
  createdAt: string
  relatedId?: string
}

export type Role = 'breeder' | 'veterinarian' | 'manager'

export type SowStatus = Sow['status']
export type BoarStatus = Boar['status']
export type HealthStatus = Sow['healthStatus']