export type UserRole = 'manager' | 'milker' | 'vet'

export type CattleStatus = 'healthy' | 'sick' | 'pregnant' | 'calving' | 'sold' | 'dead'

export type NoteType = 'health' | 'breeding' | 'feeding' | 'treatment' | 'other'
export type NoteStatus = 'pending' | 'processing' | 'resolved' | 'rejected'

export type BreedingType = 'natural' | 'artificial'
export type BreedingStatus = 'planned' | 'completed' | 'successful' | 'failed' | 'aborted'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
}

export interface Cattle {
  id: number
  tagNumber: string
  breed: string
  birthDate: string
  gender: string
  status: CattleStatus
  motherId?: number
  fatherId?: number
  weight?: number
  location?: string
  description?: string
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CattleNote {
  id: number
  cattleId: number
  authorId: number
  author: User
  type: NoteType
  content: string
  status: NoteStatus
  assigneeId?: number
  followUp?: string
  dueDate?: string
  breedingRecordId?: number
  createdAt: string
  updatedAt: string
}

export interface BreedingRecord {
  id: number
  cowId: number
  cow: Cattle
  bullId: number
  bull: Cattle
  type: BreedingType
  breedingDate: string
  status: BreedingStatus
  expectedCalvingDate?: string
  actualCalvingDate?: string
  calfTagNumber?: string
  notes?: string
  operatorId: number
  operator: User
  createdAt: string
  updatedAt: string
}

export interface BreedingNote {
  id: number
  breedingRecordId: number
  authorId: number
  author: User
  content: string
  status: NoteStatus
  assigneeId?: number
  followUp?: string
  relatedCattleNoteId?: number
  relatedCattleNote?: CattleNote
  createdAt: string
  updatedAt: string
}