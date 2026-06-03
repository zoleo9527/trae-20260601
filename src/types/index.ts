export type RecordStatus = 'pending' | 'sampling' | 'completed' | 'abnormal'
export type NoteType = 'system' | 'manual' | 'exception'
export type TraceStage = 'procurement' | 'production' | 'sampling' | 'dispatch' | 'store_receiving'
export type TraceStatus = 'normal' | 'warning' | 'error'

export interface SampleRecord {
  id: string
  productName: string
  batchNo: string
  store: string
  status: RecordStatus
  sampleWeight: number
  sampleTime: string
  isRushOrder: boolean
  allergenMissing: boolean
  receivingUnclear: boolean
  allergenInfo: string
}

export interface SampleNote {
  id: string
  recordId: string
  author: string
  role: string
  content: string
  createdAt: string
  type: NoteType
}

export interface BatchTrace {
  id: string
  recordId: string
  stage: TraceStage
  operator: string
  timestamp: string
  status: TraceStatus
  detail: string
}

export interface FilterState {
  status: RecordStatus | 'all'
  store: string
  exceptionType: 'all' | 'rush' | 'allergen' | 'receiving'
  search: string
}
