export type Role = 'feeder' | 'sorter' | 'manager'

export type ReportStatus = 'pending' | 'rejected' | 'confirmed' | 'isolating' | 'resolved'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type IsolationStatus = 'active' | 'released'

export interface DiseaseReport {
  id: string
  reportCode: string
  reporterRole: 'feeder' | 'sorter'
  reporterName: string
  barnNumber: string
  chickenCount: number
  symptomDescription: string
  symptomPhotos: string[]
  suspectedDisease: string
  severity: Severity
  status: ReportStatus
  rejectReason?: string
  createdAt: string
  processedBy?: string
  processedAt?: string
  isolationId?: string
}

export interface IsolationRecord {
  id: string
  isolationCode: string
  reportId: string
  reportCode: string
  barnNumber: string
  isolatedChickenCount: number
  isolationStartDate: string
  isolationEndDate?: string
  isolationReason: string
  handlingMeasures: string
  handler: string
  status: IsolationStatus
  createdAt: string
}

export interface ReportStats {
  total: number
  pending: number
  confirmed: number
  isolating: number
  resolved: number
}
